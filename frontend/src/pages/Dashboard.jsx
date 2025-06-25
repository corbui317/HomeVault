import React, { useEffect, useState, useRef } from "react";
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
} from "@mui/icons-material";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [hovered, setHovered] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/photos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
  }

  async function toggleFavorite(photo) {
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
  }

  async function upload(selectedFile) {
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
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      upload(selected);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      upload(dropped);
    }
  }

  async function trashPhoto(name) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${name}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelectedPhoto(null);
      await loadFiles();
    }
  }

  function toggleSelect(name) {
    setSelectedPhotos((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  async function bulkTrash() {
    const token = localStorage.getItem("token");
    await Promise.all(
      selectedPhotos.map((name) =>
        fetch(`/api/photos/${name}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setSelectedPhotos([]);
    await loadFiles();
  }

  async function bulkFavorite() {
    const token = localStorage.getItem("token");
    await Promise.all(
      selectedPhotos.map((name) =>
        fetch(`/api/photos/${name}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setSelectedPhotos([]);
    await loadFiles();
  }

  function createAlbum() {
    alert("Album creation not implemented");
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

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
              <ListItemButton>
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
              <ListItemButton>
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
        sx={{ flexGrow: 1, p: 3 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Toolbar />
        {selectedPhotos.length > 0 && (
          <Box
            sx={{
              position: "fixed",
              top: 80,
              left: 260,
              zIndex: 1300,
              display: "flex",
              gap: 1,
            }}
          >
            <IconButton onClick={bulkFavorite} sx={{ color: "#fff" }}>
              <StarIcon />
            </IconButton>
            <IconButton onClick={bulkTrash} sx={{ color: "#fff" }}>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={createAlbum} sx={{ color: "#fff" }}>
              <AlbumIcon />
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
                {(hovered === f.name || selectedPhotos.includes(f.name)) && (
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
                    {selectedPhotos.includes(f.name) ? (
                      <CheckCircleIcon />
                    ) : (
                      <CheckCircleOutlineIcon />
                    )}
                  </IconButton>
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
              <Box>
                <IconButton sx={{ color: "#fff" }}>
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
      </Box>
    </Box>
  );
}
