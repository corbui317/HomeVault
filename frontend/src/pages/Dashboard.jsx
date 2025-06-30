import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  LinearProgress,
  Fab,
  ImageList,
  ImageListItem,
  Modal,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Photo as PhotoIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Album as AlbumIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [hovered, setHovered] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumError, setAlbumError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  // Sharing state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Memoized values for performance
  const selectedPhotosArray = useMemo(() => Array.from(selectedPhotos), [selectedPhotos]);
  const hasSelectedPhotos = useMemo(() => selectedPhotos.size > 0, [selectedPhotos]);

  // Memoized loadFiles function
  const loadFiles = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/photos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
  }, []);

  // Memoized loadSharedWith function
  const loadSharedWith = useCallback(async () => {
    if (!selectedPhoto) return;
    
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${selectedPhoto.name}/shared-with`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSharedWith(data.sharedWith || []);
    }
  }, [selectedPhoto]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Optimized toggle favorite function
  const toggleFavorite = useCallback(async (photo) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${photo.name}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedPhoto({ ...photo, favorite: data.favorite });
      await loadFiles();
    }
  }, [loadFiles]);

  // Optimized upload function
  const upload = useCallback(async (selectedFile) => {
    const fileToUpload = selectedFile || file;
    if (!fileToUpload) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("photo", fileToUpload);
    const res = await fetch("/api/photos/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setFile(null);
      await loadFiles();
    }
  }, [file, loadFiles]);

  // Optimized file change handler
  const handleFileChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      upload(selected);
    }
  }, [upload]);

  // Optimized drag handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      upload(dropped);
    }
  }, [upload]);

  // Optimized trash photo function
  const trashPhoto = useCallback(async (name) => {
    console.log(`Trashing photo: ${name}`);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${name}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      console.log(`Successfully trashed photo: ${name}`);
      setSelectedPhoto(null);
      await loadFiles();
    } else {
      console.error(`Failed to trash photo: ${name}`, res.status, res.statusText);
    }
  }, [loadFiles]);

  // Optimized toggle select function using Set
  const toggleSelect = useCallback((name) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);

  // Optimized bulk operations
  const bulkTrash = useCallback(async () => {
    const token = localStorage.getItem("token");
    await Promise.all(
      selectedPhotosArray.map((name) =>
        fetch(`/api/photos/${name}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setSelectedPhotos(new Set());
    await loadFiles();
  }, [selectedPhotosArray, loadFiles]);

  const bulkFavorite = useCallback(async () => {
    const token = localStorage.getItem("token");
    await Promise.all(
      selectedPhotosArray.map((name) =>
        fetch(`/api/photos/${name}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setSelectedPhotos(new Set());
    await loadFiles();
  }, [selectedPhotosArray, loadFiles]);

  // Optimized album handlers
  const handleOpenAlbumModal = useCallback(() => {
    setAlbumModalOpen(true);
    setAlbumName("");
    setAlbumError("");
  }, []);

  const handleCloseAlbumModal = useCallback(() => {
    setAlbumModalOpen(false);
    setAlbumName("");
    setAlbumError("");
  }, []);

  const handleAddToAlbum = useCallback(async () => {
    if (!albumName.trim()) {
      setAlbumError("Album name is required");
      return;
    }
    const token = localStorage.getItem("token");
    const res = await fetch("/api/albums/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        albumName: albumName.trim(),
        photoNames: selectedPhotosArray,
      }),
    });
    if (!res.ok) {
      setAlbumError("Failed to add to album");
      return;
    }
    setAlbumModalOpen(false);
    setAlbumName("");
    setAlbumError("");
    setSelectedPhotos(new Set());
  }, [albumName, selectedPhotosArray]);

  // Optimized sharing functions
  const handleOpenShareModal = useCallback(() => {
    setShareModalOpen(true);
    setShareEmail("");
    setShareError("");
    loadSharedWith();
  }, [loadSharedWith]);

  const handleCloseShareModal = useCallback(() => {
    setShareModalOpen(false);
    setShareEmail("");
    setShareError("");
    setSharedWith([]);
  }, []);

  const handleShare = useCallback(async () => {
    if (!shareEmail.trim()) {
      setShareError("Email is required");
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${selectedPhoto.name}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: shareEmail.trim() }),
    });

    if (res.ok) {
      setShareEmail("");
      setShareError("");
      setSnackbar({ open: true, message: "Photo shared successfully!", severity: "success" });
      await loadSharedWith();
    } else {
      const data = await res.json();
      setShareError(data.msg || "Failed to share photo");
    }
  }, [shareEmail, selectedPhoto, loadSharedWith]);

  const handleUnshare = useCallback(async (email) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${selectedPhoto.name}/share/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setSnackbar({ open: true, message: "Photo unshared successfully!", severity: "success" });
      await loadSharedWith();
    } else {
      setSnackbar({ open: true, message: "Failed to unshare photo", severity: "error" });
    }
  }, [selectedPhoto, loadSharedWith]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            HomeVault
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: "auto", flex: 1 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => fileInputRef.current.click()}>
                <ListItemIcon>
                  <UploadIcon />
                </ListItemIcon>
                <ListItemText primary="Upload" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/dashboard")}>
                <ListItemIcon>
                  <PhotoIcon />
                </ListItemIcon>
                <ListItemText primary="Photos" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/dashboard/albums")}>
                <ListItemIcon>
                  <AlbumIcon />
                </ListItemIcon>
                <ListItemText primary="Albums" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/dashboard/favorites")}>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText primary="Favorites" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/dashboard/trash")}>
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <ListItemText primary="Trash" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/dashboard/settings")}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
        <Box sx={{ p: 2 }}>
          <LinearProgress variant="determinate" value={90} />
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>U</Avatar>
            <Typography variant="body2">User</Typography>
          </Box>
          <ListItemButton onClick={logout} sx={{ mt: 1 }}>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          position: "relative",
          height: "100vh",
          minHeight: 0,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragActive && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(24,28,32,0.85)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700 }}>
              Drop files to upload
            </Typography>
          </Box>
        )}
        <Toolbar />
        {hasSelectedPhotos && (
          <Box
            sx={{
              position: "fixed",
              top: 80,
              right: 32,
              zIndex: 1300,
              display: "flex",
              gap: 1,
            }}
          >
            <IconButton onClick={bulkFavorite} sx={{ color: "#fff" }}>
              <StarIcon />
            </IconButton>
            <IconButton onClick={handleOpenAlbumModal} sx={{ color: "#fff" }}>
              <AlbumIcon />
            </IconButton>
            <IconButton onClick={bulkTrash} sx={{ color: "#fff" }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <ImageList variant="masonry" cols={3} gap={8} className="masonry-grid">
          {files
            .filter((f) => f.name !== ".gitkeep")
            .map((f) => (
              <ImageListItem
                key={f.name}
                onMouseEnter={() => setHovered(f.name)}
                onMouseLeave={() => setHovered(null)}
                sx={{ position: "relative" }}
              >
                {(hovered === f.name || selectedPhotos.has(f.name)) && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(f.name);
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      color: "#fff",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    {selectedPhotos.has(f.name) ? (
                      <CheckCircleIcon />
                    ) : (
                      <CheckCircleOutlineIcon />
                    )}
                  </IconButton>
                )}
                
                {/* Ownership indicator */}
                {!f.isOwner && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      zIndex: 1,
                    }}
                  >
                    Shared
                  </Box>
                )}
                
                <img
                  className="masonry-image"
                  src={`/uploads/${f.name}`}
                  alt={f.name}
                  loading="lazy"
                  onClick={() => setSelectedPhoto(f)}
                />
              </ImageListItem>
            ))}
        </ImageList>
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: "fixed", bottom: 32, right: 32 }}
          onClick={() => fileInputRef.current.click()}
        >
          <UploadIcon />
        </Fab>
        <Modal
          open={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(4px)",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", p: 1 }}
            >
              <IconButton
                onClick={() => setSelectedPhoto(null)}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {selectedPhoto && (
                  <Typography variant="body2" sx={{ color: "#aaa", mr: 1 }}>
                    {selectedPhoto.isOwner ? "Your photo" : "Shared with you"}
                  </Typography>
                )}
                <IconButton 
                  sx={{ color: "#fff" }}
                  onClick={handleOpenShareModal}
                  disabled={!selectedPhoto?.isOwner}
                  title={selectedPhoto?.isOwner ? "Share photo" : "Only owner can share"}
                >
                  <ShareIcon />
                </IconButton>
                <IconButton sx={{ color: "#fff" }}>
                  <InfoIcon />
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={() => toggleFavorite(selectedPhoto)}
                >
                  {selectedPhoto?.favorite ? <StarIcon /> : <StarIcon />}
                </IconButton>
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={() => trashPhoto(selectedPhoto.name)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
              }}
            >
              {selectedPhoto && (
                <img
                  src={`/uploads/${selectedPhoto.name}`}
                  alt={selectedPhoto.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </Box>
          </Box>
        </Modal>
        <Dialog
          open={albumModalOpen}
          onClose={handleCloseAlbumModal}
          PaperProps={{
            sx: {
              background: "#181c20",
              color: "#fff",
              borderRadius: 3,
              minWidth: 340,
            },
          }}
        >
          <DialogTitle sx={{ color: "#fff", background: "#23272f" }}>
            Add to Album
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Album Name"
              fullWidth
              variant="filled"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              error={!!albumError}
              helperText={albumError}
              sx={{ input: { color: "#fff" }, label: { color: "#aaa" } }}
            />
          </DialogContent>
          <DialogActions sx={{ background: "#23272f" }}>
            <Button onClick={handleCloseAlbumModal} sx={{ color: "#fff" }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToAlbum}
              sx={{ color: "#fff" }}
              variant="contained"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Share Modal */}
        <Dialog
          open={shareModalOpen}
          onClose={handleCloseShareModal}
          PaperProps={{
            sx: {
              background: "#181c20",
              color: "#fff",
              borderRadius: 3,
              minWidth: 400,
            },
          }}
        >
          <DialogTitle sx={{ color: "#fff", background: "#23272f" }}>
            Share Photo
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                fullWidth
                variant="filled"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                error={!!shareError}
                helperText={shareError}
                placeholder="Enter email address to share with"
                sx={{ 
                  input: { color: "#fff" }, 
                  label: { color: "#aaa" },
                  "& .MuiFilledInput-root": {
                    backgroundColor: "#2a2f38",
                    "&:hover": { backgroundColor: "#323740" },
                    "&.Mui-focused": { backgroundColor: "#323740" }
                  }
                }}
              />
              
              {sharedWith.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: "#aaa", mb: 1 }}>
                    Currently shared with:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {sharedWith.map((email, index) => (
                      <Chip
                        key={index}
                        label={email}
                        onDelete={() => handleUnshare(email)}
                        deleteIcon={<CloseIcon />}
                        sx={{
                          backgroundColor: "#2a2f38",
                          color: "#fff",
                          "& .MuiChip-deleteIcon": {
                            color: "#aaa",
                            "&:hover": { color: "#fff" }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ background: "#23272f" }}>
            <Button onClick={handleCloseShareModal} sx={{ color: "#fff" }}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              sx={{ color: "#fff" }}
              variant="contained"
              disabled={!shareEmail.trim()}
            >
              Share
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
