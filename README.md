# HomeVault

This project includes a Node/Express backend and a React frontend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [MongoDB](https://www.mongodb.com/) running locally or in the cloud

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd HomeVault
```

### 2. Install all dependencies

#### Install root dependencies (for dev script and production server):

```bash
npm install
```

#### Install backend and frontend dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Create the uploads directory (if it doesn't exist)

```bash
mkdir uploads
```

### 4. Configure environment variables

Create a file named `.env` inside the `backend` folder with the following contents (edit as needed):

```
MONGO_URI=mongodb://localhost:27017/homevault
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:3000
PORT=5000
BACKEND_PORT=5000
```

**Never commit your .env file to version control!**

### 5. Add Firebase config (if using Firebase Auth/Storage)

Create a file `frontend/src/firebase.js` and fill in your Firebase config as described in the codebase.

### 6. Add social login logos

Place the following files in `frontend/public/assets/`:

- `google-logo.png`
- `facebook-logo.png`
- `twitter-logo.png`

## Running the project

### Development mode (recommended for local dev)

From the project root, run:

```bash
npm run dev
```

This will start both the backend and frontend concurrently.

### Production mode

1. Build the frontend:

```bash
cd frontend
npm run build
cd ..
```

2. Start the server:

```bash
node server.js
```

Visit `http://localhost:5000` to use the app.

## Security & .gitignore

- Your `.env` files and any sensitive keys should **never** be committed to git.
- The `.gitignore` is already set up to ignore:
  - `node_modules/`
  - `frontend/build/`
  - `.env` and `backend/.env`
  - `uploads/` (except `.gitkeep`)
- **Never share your JWT_SECRET, Firebase API keys, or MongoDB credentials publicly.**

## Troubleshooting

- If you see warnings about deprecated APIs (such as `util._extend`), they originate from underlying libraries and should not prevent the dev server from starting.
- If you have issues, run `npm install` in the root, `backend`, and `frontend` folders.

---

For more details, see the code comments and documentation in each folder.
