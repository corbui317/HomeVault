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
  Paper,
} from "@mui/material";
import {
  Photo as PhotoIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Album as AlbumIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch albums from backend (placeholder)
    async function fetchAlbums() {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/albums", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
      }
    }
    fetchAlbums();
  }, []);

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
        sx={{
          flexGrow: 1,
          p: 3,
          background: "#181c20",
          color: "#fff",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          My Albums
        </Typography>
        <ImageList variant="masonry" cols={3} gap={24}>
          {albums.map((album) => (
            <ImageListItem key={album._id || album.name}>
              <Paper
                sx={{
                  background: "#23272f",
                  color: "#fff",
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minHeight: 180,
                  justifyContent: "center",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {album.name}
                </Typography>
                {album.cover && (
                  <img
                    src={`/uploads/${album.cover}`}
                    alt={album.name}
                    style={{
                      width: "100%",
                      maxHeight: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                )}
                <Typography variant="body2" sx={{ color: "#aaa" }}>
                  {album.photos.length} photo
                  {album.photos.length !== 1 ? "s" : ""}
                </Typography>
              </Paper>
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    </Box>
  );
}
