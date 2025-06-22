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
    <div className="dashboard p-4">
      <h1 className="text-3xl mb-4">HomeVault Dashboard</h1>
      <form onSubmit={upload} className="mb-4">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" className="ml-2">Upload</button>
        <button type="button" onClick={logout} className="ml-2">Logout</button>
      </form>
      <ul>
        {files.map((f) => (
          <li key={f}>
            <a href={`/uploads/${f}`} target="_blank" rel="noopener noreferrer" className="mr-2 underline text-blue-500">
              {f}
            </a>
            <button onClick={() => remove(f)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
