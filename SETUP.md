# SkillShare Application Setup Guide

## Overview
The SkillShare application is a single-file React component that enables users to discover, offer, and request skills through a simple interface powered by Firebase.

## Prerequisites
- Node.js 16+ and npm
- Google account for Firebase setup
- Git (optional, for version control)

## Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name (e.g., "skillshare-app")
   - Enable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication**
   - In Firebase Console, go to Authentication → Sign-in method
   - Enable "Anonymous" authentication
   - Enable "Custom token" authentication (if using external auth)

3. **Create Firestore Database**
   - Go to Firestore Database → Create database
   - Choose "Start in test mode" (we'll add security rules)
   - Select a location (choose closest to your users)
   - Click "Create database"

4. **Get Firebase Configuration**
   - Go to Project Settings (⚙️ icon) → General
   - Under "Your apps", click the web icon (`</>`)
   - Register app with nickname "SkillShare Web"
   - Copy the firebaseConfig object

5. **Deploy Security Rules**
   - Go to Firestore Database → Rules
   - Replace the default rules with the content from `firestore.rules`
   - Click "Publish"

## Step 2: Local Development Setup

1. **Clone or Download the Project**
   ```bash
   cd skillswitch
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and replace with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_actual_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
   REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   REACT_APP_SKILLSHARE_APP_ID=skillshare_app
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

## Step 3: Testing the Application

### Basic Functionality Test

1. **Initial Load**
   - App should authenticate automatically (anonymous mode)
   - "Connected" status should appear in header
   - Skills list should load (empty initially)

2. **Offer a Skill**
   - Click "Offer New Skill" button
   - Fill in the form:
     - Your Name: "Test Teacher"
     - Skill Title: "JavaScript Basics"
     - Description: "Learn fundamental JavaScript concepts"
     - Category: "Programming"
   - Click "Offer Skill"
   - Skill should appear in "My Skills Offered" section

3. **Discover Skills**
   - The new skill should appear in the main grid
   - Click "View Details" on any skill
   - Should navigate to skill detail page

4. **Request a Lesson**
   - On skill detail page (not your own skill)
   - Fill in "Your Name" field
   - Add optional message
   - Click "Request Lesson"
   - Should navigate to Dashboard

5. **Check Dashboard**
   - Navigate to "My Dashboard"
   - Request should appear under "My Requests (As Student)"
   - Skill should appear under "My Skills Offered"

## Step 4: Production Deployment

### Option 1: Firebase Hosting (Recommended)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory as "build"
   - Configure as single-page app (rewrite all URLs to /index.html)
   - Don't overwrite index.html

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Option 2: Other Hosting Platforms

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Platform**
   - **Vercel**: Connect GitHub repository and deploy automatically
   - **Netlify**: Drag and drop the `build` folder
   - **AWS S3 + CloudFront**: Upload build folder to S3 bucket

## Step 5: Custom Authentication (Optional)

If you have an existing authentication system:

1. **Generate Custom Tokens**
   ```javascript
   // Node.js server example
   const admin = require('firebase-admin');
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   const uid = 'your-custom-user-id';
   const customToken = await admin.auth().createCustomToken(uid);
   ```

2. **Pass Token to Application**
   ```html
   <script>
     window.__initial_auth_token = 'the-custom-token-here';
   </script>
   <script src="/static/js/bundle.js"></script>
   ```

## File Structure

```
skillswitch/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── index.css
│   └── SkillShareApp.jsx
├── package.json
├── tailwind.config.js
├── firestore.rules
├── .env.example
└── SETUP.md
```

## Key Features Implemented

✅ **Single-file React component** (SkillShareApp.jsx)
✅ **Firebase Authentication** with token and anonymous support
✅ **Firestore collections** for skills and requests
✅ **Real-time data synchronization** using onSnapshot listeners
✅ **Three main views**: SkillList, SkillDetail, Dashboard
✅ **Modal-based interactions** for forms and video calls
✅ **Tailwind CSS styling** with responsive design
✅ **Error handling** for Firebase operations
✅ **Form validation** and sanitization
✅ **Component cleanup** and memory management
✅ **Security rules** for Firestore access control
✅ **Mock video call functionality** with disclaimers

## Limitations and Future Enhancements

### Current Limitations
- **Teacher notifications**: Due to Firestore security rules, teachers can't automatically see incoming requests
- **Search/filtering**: Basic skill listing without search functionality
- **User profiles**: No persistent user profiles or ratings
- **Real video calling**: Mock implementation only

### Production Considerations
- **Server-side logic**: Cloud Functions for teacher notifications
- **Payment processing**: Stripe integration for paid lessons
- **Video service**: Real WebRTC or third-party video integration
- **Advanced security**: Rate limiting, input sanitization, audit logging
- **Performance**: Pagination, caching, image optimization

## Troubleshooting

### Common Issues

1. **"Failed to authenticate" Error**
   - Check Firebase configuration in `.env`
   - Ensure Authentication is enabled in Firebase Console
   - Verify security rules are properly deployed

2. **"Failed to load skills" Error**
   - Check Firestore database is created
   - Verify security rules allow read access
   - Check network connectivity

3. **Build/Deploy Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility
   - Verify environment variables are set

### Getting Help

1. Check browser console for detailed error messages
2. Verify Firebase project settings and rules
3. Test with different browsers/network connections
4. Review Firebase documentation for latest API changes

## Support

For questions or issues:
1. Review this setup guide
2. Check Firebase documentation
3. Test with the provided examples
4. Verify all configuration steps were completed correctly