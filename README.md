# HomeVault

This project includes a Node/Express backend and a React frontend.

## Setup

Install dependencies for both projects before running anything:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

The frontend relies on `react-router-dom`; if this dependency isn't installed you
will see errors such as "Module not found: Can't resolve 'react-router-dom'" when
starting the React dev server. Running `npm install` in the `frontend` directory
will install it along with the other React packages.

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