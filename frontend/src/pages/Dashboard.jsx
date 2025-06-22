import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
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

  async function remove(name) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/${name}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadFiles();
    }
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <h1>HomeVault</h1>
        <ul>
          <li>
            <button type="button" onClick={() => fileInputRef.current.click()}>Upload</button>
          </li>
          <li>Delete</li>
          <li>Recently Added</li>
          <li>Trash</li>
          <li>Albums</li>
          <li>Favorites</li>
          <li>
            <button type="button" onClick={logout}>Sign Out</button>
          </li>          
        </ul>
      </nav>
      <div className="dashboard-content">
        <h2 className="mb-4">HomeVault Dashboard</h2>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div className="gallery-grid">
          {files.filter((f) => f !== ".gitkeep").map((f) => (
            <div key={f} className="photo-item">
              <img src={`/uploads/${f}`} alt={f} />
              <button onClick={() => remove(f)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
