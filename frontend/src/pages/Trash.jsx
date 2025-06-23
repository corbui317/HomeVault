import React, { useEffect, useState } from "react";
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
  ImageList,
  ImageListItem,
  Modal,
  IconButton,
} from "@mui/material";
import {
  Photo as PhotoIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/photos/trash", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
  }

  async function restorePhoto(file) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/trash/${file.trashName}/restore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelected(null);
      await loadFiles();
    }
  }

  async function deleteForever(file) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/trash/${file.trashName}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelected(null);
      await loadFiles();
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
              <ListItemButton onClick={() => navigate("/dashboard")}>
                <ListItemIcon>
                  <PhotoIcon />
                </ListItemIcon>
                <ListItemText primary="Photos" />
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
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <ImageList variant="masonry" cols={3} gap={8} className="masonry-grid">
          {files.map((f) => (
            <ImageListItem key={f.trashName}>
              <img
                className="masonry-image"
                src={`/uploads/trash/${f.trashName}`}
                alt={f.originalName}
                loading="lazy"
                onClick={() => setSelected(f)}
              />
            </ImageListItem>
          ))}
        </ImageList>
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
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
                onClick={() => setSelected(null)}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIcon />
              </IconButton>
              {selected && (
                <Box>
                  <IconButton
                    sx={{ color: "#fff" }}
                    onClick={() => restorePhoto(selected)}
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    sx={{ color: "#fff" }}
                    onClick={() => deleteForever(selected)}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Box>
              )}
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
              {selected && (
                <img
                  src={`/uploads/trash/${selected.trashName}`}
                  alt={selected.originalName}
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
