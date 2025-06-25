# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your self-hosted HomeVault application.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Your backend and frontend code (already updated)

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (optional)
   - Enable **Facebook** (optional)
   - Enable **Twitter** (optional)

## Step 2: Get Service Account Key

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file
5. **Keep this file secure and never commit it to version control!**

## Step 3: Backend Configuration

1. Copy the downloaded service account JSON content
2. In your `backend/.env` file, add:

   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   ```

   Replace the JSON content with your actual service account key.

3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

## Step 4: Frontend Configuration

1. In your `frontend/.env` file, add your Firebase config:

   ```bash
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

2. Get these values from:
   - Firebase Console → Project Settings → General → Your apps → Web app
   - Or create a new web app if you haven't already

## Step 5: Security Rules

Add to your `.gitignore`:

```
# Firebase service account
serviceAccountKey.json
backend/serviceAccountKey.json
*.json
!package.json
!package-lock.json
!yarn.lock
```

## Step 6: Test the Setup

1. Start your backend:

   ```bash
   cd backend
   npm start
   ```

2. Start your frontend:

   ```bash
   cd frontend
   npm start
   ```

3. Try logging in with Firebase Authentication
4. Upload a photo to test the complete flow

## How It Works

1. **Frontend**: Users sign in with Firebase Auth (email/password, Google, etc.)
2. **Token**: Firebase provides an ID token that's stored in localStorage
3. **API Calls**: Frontend sends this token in the Authorization header
4. **Backend**: Firebase Admin SDK verifies the token and extracts user info
5. **Database**: Photos are associated with Firebase UIDs instead of custom user IDs

## Troubleshooting

### 401 Unauthorized Errors

- Check that your service account key is correctly formatted in the environment variable
- Ensure the Firebase project ID matches between frontend and backend
- Verify the token is being sent in the Authorization header

### Token Verification Errors

- Check Firebase Console logs for authentication errors
- Ensure your service account has the necessary permissions
- Verify the token hasn't expired (they expire after 1 hour)

### Database Issues

- The Photo model now uses Firebase UIDs (strings) instead of MongoDB ObjectIds
- Existing data may need to be migrated if you had previous users

## Security Best Practices

1. **Never commit service account keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Rotate service account keys** periodically
4. **Monitor Firebase Console** for authentication logs
5. **Set up proper Firebase Security Rules** if using Firestore/Storage

## Migration from Custom Auth

If you were previously using custom JWT authentication:

1. Existing photos will need to be migrated to use Firebase UIDs
2. You can remove the old User model and auth routes
3. The new system uses Firebase UIDs for all user identification

## Support

For Firebase-specific issues, refer to:

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin)
- [Firebase Console](https://console.firebase.google.com/) for logs and monitoring
