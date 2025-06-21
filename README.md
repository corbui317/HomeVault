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

Start the backend API:

```bash
cd backend
npm start
```

In another terminal start the React frontend:

```bash
cd frontend
npm start
```

The root `server.js` can also serve the compiled frontend if you run
`node server.js` after building the React project.