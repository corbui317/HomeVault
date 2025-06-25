const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Album = require("../models/Album");
const Photo = require("../models/Photo");

// Get all albums for the user
router.get("/", auth, async (req, res) => {
  try {
    const albums = await Album.find({ createdBy: req.user.uid });
    // For each album, get the first photo as the cover (if any)
    const albumsWithCover = await Promise.all(
      albums.map(async (album) => {
        let cover = null;
        if (album.photos.length > 0) {
          cover = album.photos[0];
        }
        return {
          _id: album._id,
          name: album.name,
          photos: album.photos,
          cover,
        };
      })
    );
    res.json({ albums: albumsWithCover });
  } catch (err) {
    res.status(500).json({ msg: "Unable to fetch albums" });
  }
});

// Add photos to an album (create if not exists)
router.post("/add", auth, async (req, res) => {
  const { albumName, photoNames } = req.body;
  if (!albumName || !Array.isArray(photoNames) || photoNames.length === 0) {
    return res.status(400).json({ msg: "Album name and photo names required" });
  }
  try {
    let album = await Album.findOne({
      name: albumName,
      createdBy: req.user.uid,
    });
    if (!album) {
      album = await Album.create({
        name: albumName,
        photos: photoNames,
        createdBy: req.user.uid,
      });
    } else {
      // Add new photos, avoid duplicates
      album.photos = Array.from(new Set([...album.photos, ...photoNames]));
      await album.save();
    }
    res.json({ album });
  } catch (err) {
    res.status(500).json({ msg: "Unable to add to album" });
  }
});

module.exports = router;
