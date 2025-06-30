# HomeVault

A secure photo storage and sharing application with user-specific access control.

## Features

### Photo Management

- Upload and store photos securely
- Organize photos into albums
- Mark photos as favorites
- Move photos to trash (soft delete)
- Bulk operations (select multiple photos)

### User Access Control

- **User-specific photo access**: Users can only view photos they have uploaded
- **Photo sharing**: Share photos with other users via email
- **Access validation**: All photo operations validate user permissions
- **Ownership indicators**: Clear visual indicators for owned vs shared photos

### Sharing System

- Share photos with specific users by email address
- View currently shared photos and recipients
- Unshare photos from specific users
- Only photo owners can share/unshare their photos
- Shared users can view, favorite, and trash shared photos. Sharing permissions remain with the original owner

### Security

- Firebase authentication integration
- JWT token-based API authentication
- User-specific file access control
- Secure file upload handling

## API Endpoints

### Photos

- `GET /api/photos` - Get user's photos (owned + shared)
- `GET /api/photos/:filename` - Get specific photo (with access control)
- `POST /api/photos/upload` - Upload new photo
- `POST /api/photos/:filename/favorite` - Toggle favorite status
- `DELETE /api/photos/:filename` - Move photo to trash

### Sharing

- `POST /api/photos/:filename/share` - Share photo with email
- `DELETE /api/photos/:filename/share/:email` - Unshare photo from email
- `GET /api/photos/:filename/shared-with` - Get list of users photo is shared with
- `GET /api/photos/shared/by-me` - Get photos shared by current user
- `GET /api/photos/shared/with-me` - Get photos shared with current user

### Albums

- `GET /api/albums` - Get user's albums
- `POST /api/albums/add` - Add photos to album
- `DELETE /api/albums/:albumName` - Delete album

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Database Models

### Photo

```javascript
{
  filename: String,           // Unique filename
  uploadedBy: String,         // Firebase UID of owner
  favoriteBy: [String],       // Array of Firebase UIDs
  trashBy: [String],          // Array of Firebase UIDs
  sharedWith: [{              // Array of shared users
    email: String,
    sharedAt: Date
  }],
  isPublic: Boolean,          // For future public sharing
  createdAt: Date,
  updatedAt: Date
}
```

### Share

```javascript
{
  photoId: ObjectId,          // Reference to Photo
  filename: String,           // Photo filename
  sharedBy: String,           // Firebase UID of sharer
  sharedWith: String,         // Email of recipient
  sharedAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

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

## Access Control Rules

1. **Photo Ownership**: Users can only access photos they uploaded
2. **Photo Sharing**: Users can access photos shared with them via email
3. **Sharing Permissions**: Only photo owners can share/unshare their photos
4. **Operation Permissions**: Shared users can view, favorite, and trash shared photos
5. **No Cross-User Access**: Users cannot see photos from other users unless explicitly shared

## Security Features

- All API endpoints require valid Firebase JWT tokens
- File access is validated against user permissions
- Photo sharing is restricted to email addresses
- No direct file system access without authentication
- User-specific trash and favorites tracking

## changes2
