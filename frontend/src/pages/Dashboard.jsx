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
  StarBorder as StarBorderIcon,
  ZoomIn as ZoomInIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
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
              <ListItemButton>
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
              <ListItemButton>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText primary="Favorites" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
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
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <ImageList variant="masonry" cols={3} gap={8} className="masonry-grid">
          {files
            .filter((f) => f !== ".gitkeep")
            .map((f) => (
              <ImageListItem key={f}>
                <img
                  className="masonry-image"
                  src={`/uploads/${f}`}
                  alt={f}
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
                <IconButton sx={{ color: "#fff" }}>
                  <StarBorderIcon />
                </IconButton>
                <IconButton sx={{ color: "#fff" }}>
                  <DeleteIcon />
                </IconButton>
                <IconButton sx={{ color: "#fff" }}>
                  <ZoomInIcon />
                </IconButton>
                <IconButton sx={{ color: "#fff" }}>
                  <MoreVertIcon />
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
                  src={`/uploads/${selectedPhoto}`}
                  alt={selectedPhoto}
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
