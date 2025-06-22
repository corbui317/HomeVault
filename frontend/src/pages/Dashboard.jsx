import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
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

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("photo", file);
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
          <li>Upload</li>
          <li>Delete</li>
          <li>Recently Added</li>
          <li>Trash</li>
          <li>Albums</li>
          <li>Favorites</li>
        </ul>
      </nav>
      <div className="dashboard-content">
        <h2 className="mb-4">HomeVault Dashboard</h2>
        <form onSubmit={upload} className="mb-4">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button type="submit" className="ml-2">Upload</button>
          <button type="button" onClick={logout} className="ml-2">Logout</button>
        </form>
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
