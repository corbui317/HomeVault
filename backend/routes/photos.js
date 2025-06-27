const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const Photo = require("../models/Photo");
const Share = require("../models/Share");
const NodeCache = require("node-cache");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Cache for user photos (5 minute TTL)
const photoCache = new NodeCache({ stdTTL: 300 });

// Helper function to check if user has access to a photo (optimized)
function hasPhotoAccess(userUid, userEmail, photo) {
  // User owns the photo
  if (photo.uploadedBy === userUid) return true;
  
  // Photo is shared with user - use Set for O(1) lookup
  const sharedEmails = new Set(photo.sharedWith.map(share => share.email));
  return sharedEmails.has(userEmail);
}

// Get all photos that user has access to (owned or shared) - optimized
router.get("/", auth, async (req, res) => {
  try {
    const cacheKey = `photos_${req.user.uid}`;
    let photos = photoCache.get(cacheKey);
    
    if (!photos) {
      // Single optimized aggregation query instead of multiple queries
      photos = await Photo.aggregate([
        {
          $match: {
            $or: [
              { uploadedBy: req.user.uid },
              { 'sharedWith.email': req.user.email }
            ]
          }
        },
        {
          $addFields: {
            isOwner: { $eq: ['$uploadedBy', req.user.uid] },
            isFavorited: { $in: [req.user.uid, '$favoriteBy'] },
            isTrashed: { $in: [req.user.uid, '$trashBy'] }
          }
        },
        {
          $match: { isTrashed: false }
        },
        {
          $project: {
            name: '$filename',
            favorite: '$isFavorited',
            isOwner: 1,
            sharedBy: {
              $cond: {
                if: '$isOwner',
                then: null,
                else: '$uploadedBy'
              }
            },
            uploadedAt: '$createdAt'
          }
        }
      ]);
      
      photoCache.set(cacheKey, photos);
    }
    
    res.json({ files: photos });
  } catch (err) {
    console.error("Error fetching photos:", err);
    res.status(500).json({ msg: "Unable to list files" });
  }
});

// Get a specific photo (with access control) - optimized
router.get("/:filename", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) {
      return res.status(404).json({ msg: "Photo not found" });
    }
    
    // Check if user has access to this photo
    if (!hasPhotoAccess(req.user.uid, req.user.email, photo)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: "File not found" });
    }
    
    res.sendFile(filePath);
  } catch (err) {
    console.error("Error serving photo:", err);
    res.status(500).json({ msg: "Error serving photo" });
  }
});

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  console.log("/api/photos/upload hit");
  if (!req.file) {
    console.error("No file uploaded");
    return res.status(400).json({ msg: "No file uploaded" });
  }
  console.log("Uploaded file:", req.file);
  try {
    await Photo.create({
      filename: req.file.filename,
      uploadedBy: req.user.uid,
    });
    
    // Invalidate cache for this user
    photoCache.del(`photos_${req.user.uid}`);
    
    res.json({ filename: req.file.filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ msg: "Upload error" });
  }
});

// Share a photo with another user by email - optimized
router.post("/:filename/share", auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }
    
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) {
      return res.status(404).json({ msg: "Photo not found" });
    }
    
    // Only the owner can share the photo
    if (photo.uploadedBy !== req.user.uid) {
      return res.status(403).json({ msg: "Only the owner can share this photo" });
    }
    
    // Check if already shared with this email - use Set for O(1) lookup
    const sharedEmails = new Set(photo.sharedWith.map(share => share.email));
    if (sharedEmails.has(email)) {
      return res.status(400).json({ msg: "Photo already shared with this email" });
    }
    
    // Add to sharedWith array
    photo.sharedWith.push({
      email: email,
      sharedAt: new Date()
    });
    await photo.save();
    
    // Create share record
    await Share.create({
      photoId: photo._id,
      filename: photo.filename,
      sharedBy: req.user.uid,
      sharedWith: email
    });
    
    // Invalidate cache for both users
    photoCache.del(`photos_${req.user.uid}`);
    photoCache.del(`photos_${email}`);
    
    res.json({ msg: "Photo shared successfully" });
  } catch (err) {
    console.error("Error sharing photo:", err);
    res.status(500).json({ msg: "Error sharing photo" });
  }
});

// Unshare a photo - optimized
router.delete("/:filename/share/:email", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) {
      return res.status(404).json({ msg: "Photo not found" });
    }
    
    // Only the owner can unshare the photo
    if (photo.uploadedBy !== req.user.uid) {
      return res.status(403).json({ msg: "Only the owner can unshare this photo" });
    }
    
    // Remove from sharedWith array - use filter for cleaner code
    photo.sharedWith = photo.sharedWith.filter(share => share.email !== req.params.email);
    await photo.save();
    
    // Update share record
    await Share.findOneAndUpdate(
      { photoId: photo._id, sharedWith: req.params.email },
      { isActive: false }
    );
    
    // Invalidate cache for both users
    photoCache.del(`photos_${req.user.uid}`);
    photoCache.del(`photos_${req.params.email}`);
    
    res.json({ msg: "Photo unshared successfully" });
  } catch (err) {
    console.error("Error unsharing photo:", err);
    res.status(500).json({ msg: "Error unsharing photo" });
  }
});

// Get shared photos (photos shared by the user) - optimized
router.get("/shared/by-me", auth, async (req, res) => {
  try {
    const shares = await Share.find({ 
      sharedBy: req.user.uid, 
      isActive: true 
    }).populate('photoId');
    
    const result = shares.map(share => ({
      filename: share.filename,
      sharedWith: share.sharedWith,
      sharedAt: share.sharedAt
    }));
    
    res.json({ shares: result });
  } catch (err) {
    console.error("Error fetching shared photos:", err);
    res.status(500).json({ msg: "Error fetching shared photos" });
  }
});

// Get photos shared with me - optimized
router.get("/shared/with-me", auth, async (req, res) => {
  try {
    const shares = await Share.find({ 
      sharedWith: req.user.email, 
      isActive: true 
    }).populate('photoId');
    
    const result = shares.map(share => ({
      filename: share.filename,
      sharedBy: share.sharedBy,
      sharedAt: share.sharedAt
    }));
    
    res.json({ shares: result });
  } catch (err) {
    console.error("Error fetching photos shared with me:", err);
    res.status(500).json({ msg: "Error fetching photos shared with me" });
  }
});

// Get users a specific photo is shared with - optimized
router.get("/:filename/shared-with", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) {
      return res.status(404).json({ msg: "Photo not found" });
    }
    
    // Only the owner can see who the photo is shared with
    if (photo.uploadedBy !== req.user.uid) {
      return res.status(403).json({ msg: "Only the owner can view sharing information" });
    }
    
    const sharedWith = photo.sharedWith.map(share => share.email);
    res.json({ sharedWith });
  } catch (err) {
    console.error("Error fetching shared users:", err);
    res.status(500).json({ msg: "Error fetching shared users" });
  }
});

// Toggle favorite - optimized
router.post("/:filename/favorite", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    
    // Check if user has access to this photo
    if (!hasPhotoAccess(req.user.uid, req.user.email, photo)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    // Use Set for O(1) operations
    const favoriteSet = new Set(photo.favoriteBy);
    let fav;
    
    if (favoriteSet.has(req.user.uid)) {
      favoriteSet.delete(req.user.uid);
      fav = false;
    } else {
      favoriteSet.add(req.user.uid);
      fav = true;
    }
    
    photo.favoriteBy = Array.from(favoriteSet);
    await photo.save();
    
    // Invalidate cache
    photoCache.del(`photos_${req.user.uid}`);
    
    res.json({ favorite: fav });
  } catch (err) {
    res.status(500).json({ msg: "Error toggling favorite" });
  }
});

// Get trash - optimized
router.get("/trash", auth, async (req, res) => {
  try {
    console.log(`Fetching trash for user: ${req.user.uid}`);
    
    // Single optimized query
    const trashedPhotos = await Photo.aggregate([
      {
        $match: {
          $and: [
            { trashBy: req.user.uid },
            {
              $or: [
                { uploadedBy: req.user.uid },
                { 'sharedWith.email': req.user.email }
              ]
            }
          ]
        }
      },
      {
        $project: {
          trashName: '$filename',
          originalName: '$filename'
        }
      }
    ]);
    
    console.log(`Found ${trashedPhotos.length} trashed photos for user ${req.user.uid}`);
    
    res.json({ files: trashedPhotos });
  } catch (err) {
    console.error("Error fetching trash:", err);
    res.status(500).json({ msg: "Unable to list trash" });
  }
});

// Restore from trash - optimized
router.post("/trash/:name/restore", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    
    // Check if user has access to this photo
    if (!hasPhotoAccess(req.user.uid, req.user.email, photo)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    // Use Set for O(1) operations
    const trashSet = new Set(photo.trashBy);
    trashSet.delete(req.user.uid);
    photo.trashBy = Array.from(trashSet);
    await photo.save();
    
    // Invalidate cache
    photoCache.del(`photos_${req.user.uid}`);
    
    res.json({ msg: "Restored" });
  } catch (err) {
    res.status(500).json({ msg: "Error restoring file" });
  }
});

// Delete from trash - optimized
router.delete("/trash/:name", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    
    // Check if user has access to this photo
    if (!hasPhotoAccess(req.user.uid, req.user.email, photo)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    // Use Set for O(1) operations
    const trashSet = new Set(photo.trashBy);
    trashSet.delete(req.user.uid);
    photo.trashBy = Array.from(trashSet);
    
    if (photo.trashBy.length === 0) {
      const filePath = path.join(uploadsDir, req.params.name);
      try {
        await fs.promises.unlink(filePath);
      } catch (e) {}
      await photo.deleteOne();
    } else {
      await photo.save();
    }
    
    // Invalidate cache
    photoCache.del(`photos_${req.user.uid}`);
    
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting file" });
  }
});

// Move to trash - optimized
router.delete("/:filename", auth, async (req, res) => {
  try {
    console.log(`Moving photo ${req.params.filename} to trash for user ${req.user.uid}`);
    
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    
    // Check if user has access to this photo
    if (!hasPhotoAccess(req.user.uid, req.user.email, photo)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    // Use Set for O(1) operations
    const trashSet = new Set(photo.trashBy);
    if (!trashSet.has(req.user.uid)) {
      trashSet.add(req.user.uid);
      photo.trashBy = Array.from(trashSet);
      await photo.save();
      console.log(`Photo ${req.params.filename} moved to trash for user ${req.user.uid}`);
    } else {
      console.log(`Photo ${req.params.filename} already in trash for user ${req.user.uid}`);
    }
    
    // Invalidate cache
    photoCache.del(`photos_${req.user.uid}`);
    
    res.json({ msg: "Trashed" });
  } catch (err) {
    console.error("Error trashing file:", err);
    res.status(500).json({ msg: "Error trashing file" });
  }
});

module.exports = router;
