require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./backend/config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/photos', require('./backend/routes/photos'));

app.use(express.static(path.join(__dirname, 'frontend', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
