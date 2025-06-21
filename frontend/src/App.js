import React, { useEffect, useState } from 'react';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [files, setFiles] = useState([]);
  const [sort, setSort] = useState('alpha');

  useEffect(() => {
    if (token) fetchPhotos();
  }, [token]);

  function handleLogin(e) {
    e.preventDefault();
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        }
      });
  }

  function fetchPhotos() {
    fetch('/api/photos', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  }

  function uploadPhoto(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/api/photos/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }).then(fetchPhotos);
  }

  function deletePhoto(name) {
    fetch(`/api/photos/${name}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(fetchPhotos);
  }

  const sorted = [...files].sort((a, b) => {
    if (sort === 'alpha') return a.localeCompare(b);
    return b.localeCompare(a);
  });

  if (!token) {
    return (
      <form className="login" onSubmit={handleLogin}>
        <h2>Login</h2>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    );
  }

  return (
    <div className="app">
      <h1>HomeVault</h1>
      <form onSubmit={uploadPhoto} className="upload">
        <input type="file" name="photo" />
        <button>Upload</button>
      </form>
      <div className="sort">
        Sort:
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="alpha">A-Z</option>
          <option value="rev">Z-A</option>
        </select>
      </div>
      <div className="gallery">
        {sorted.map(name => (
          <div key={name} className="item">
            <img src={`/uploads/${name}`} alt={name} />
            <button onClick={() => deletePhoto(name)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}