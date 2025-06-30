import React, { useState } from "react";
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
  Divider,
} from "@mui/material";
import {
  Lock as LockIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";

const menuOptions = [
  { label: "Authentication", icon: <LockIcon /> },
  { label: "Appearance", icon: <PaletteIcon /> },
  { label: "Languages", icon: <LanguageIcon /> },
];

export default function Settings() {
  const [selected, setSelected] = useState(0);

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 240,
            boxSizing: "border-box",
            background: "#23272f",
            color: "#fff",
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Settings
          </Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: "#333" }} />
        <List>
          {menuOptions.map((option, idx) => (
            <ListItem key={option.label} disablePadding>
              <ListItemButton
                selected={selected === idx}
                onClick={() => setSelected(idx)}
                sx={{ color: "#fff" }}
              >
                <ListItemIcon sx={{ color: "#fff" }}>
                  {option.icon}
                </ListItemIcon>
                <ListItemText primary={option.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          background: "#181c20",
          color: "#fff",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {selected === 0 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Authentication
            </Typography>
            <Typography variant="body1" sx={{ color: "#aaa" }}>
              Manage your authentication settings here. (Coming soon)
            </Typography>
          </Box>
        )}
        {selected === 1 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Appearance
            </Typography>
            <Typography variant="body1" sx={{ color: "#aaa" }}>
              Customize the appearance of your app. (Coming soon)
            </Typography>
          </Box>
        )}
        {selected === 2 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Languages
            </Typography>
            <Typography variant="body1" sx={{ color: "#aaa" }}>
              Select your preferred language. (Coming soon)
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
