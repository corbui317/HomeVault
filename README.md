# HomeVault

This project includes a Node/Express backend and a React frontend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [MongoDB](https://www.mongodb.com/) running locally or in the cloud

## Setup

1. **Clone the repository** and change into the project directory:

   ```bash
   git clone <repo-url>
   cd HomeVault
   ```

2. **Install root dependencies** (used by the development script and the production server):

   ```bash
   npm install
   ```

3. **Install backend and frontend dependencies**:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

   The frontend relies on `react-router-dom` and other React packages which will be installed by the command above. The `frontend/package-lock.json` file is not tracked in the repository, so a fresh lock file will be generated the first time you run `npm install` in that folder. be installed by the command above.

4. **Create the `uploads` directory.** Uploaded photos are stored in this
   folder. A blank `.gitkeep` file is included so the folder exists when the
   repository is cloned, but if it doesn't exist you can create it with:

   ```bash
   mkdir uploads
   ```

5. **Configure the database and environment variables.** Create a file named `.env` inside the `backend` folder with the following contents (adjust as needed):env`inside the`backend` folder with the following contents (adjust as needed):

   ```
   MONGO_URI=mongodb://localhost:27017/homevault
   JWT_SECRET=your_secret_key
   CLIENT_ORIGIN=http://localhost:3000
   PORT=5000
   # Optional: port for the frontend dev proxy.
   # If omitted, the proxy uses PORT.
   BACKEND_PORT=5000
   ```

   Ensure that your MongoDB server is running and reachable via the `MONGO_URI` you provide.

## Running in development

From the project root you can start both the backend and the React
frontend with a single command:

```bash
npm run dev
```

This works the same on Windows, macOS and Linux and will run
`npm start` in the `backend` and `frontend` directories
concurrently.

The root `server.js` can still serve the compiled frontend if you first build the React project:

```bash
cd frontend
npm run build
cd ..
```

Then start the server:

```bash
node server.js
```

After building, open `http://localhost:5000` to view the login page.
Use the default credentials **admin/password** to sign in and access the
dashboard where you can upload and manage photos.

## Troubleshooting

Running `npm run dev` installs missing packages for the frontend and backend
automatically. If you see warnings about deprecated APIs (such as
`util._extend`) they originate from underlying libraries and should not prevent
the development server from starting. To ensure all packages are available,
run `npm install` in the project root and in each subfolder (`backend` and
`frontend`) before starting the dev script.
