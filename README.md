# SkillShare Application

A single-file React component application that enables users to discover, offer, and request skills through a simple interface powered by Firebase.

## 🚀 Quick Start

1. **Setup Firebase Project**
   - Follow the detailed setup instructions in [SETUP.md](./SETUP.md)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Run Development Server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
skillswitch/
├── src/
│   ├── SkillShareApp.jsx    # Main application component (single file)
│   ├── index.js             # React entry point
│   └── index.css            # Tailwind CSS styles
├── public/
│   └── index.html           # HTML template
├── firestore.rules          # Firebase security rules
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── .env.example             # Environment variables template
└── SETUP.md                 # Detailed setup guide
```

## ✨ Features

- **Single File Architecture**: Complete application in one React component
- **Firebase Authentication**: Custom token support with anonymous fallback
- **Real-time Data**: Live synchronization using Firestore listeners
- **Three Main Views**:
  - **SkillList**: Discover available skills and offer new ones
  - **SkillDetail**: View skill details and request lessons
  - **Dashboard**: Manage your requests and offered skills
- **Modal Interactions**: Forms and video call interface
- **Responsive Design**: Tailwind CSS for mobile-friendly experience
- **Mock Video Calls**: Demonstration of video integration with proper disclaimers

## 🔧 Technical Implementation

- **React 18** with functional components and hooks
- **Firebase SDK v9+** with modular imports
- **Tailwind CSS** for styling
- **Firestore Collections**:
  - `artifacts/{appId}/public/data/skills` - Public skill listings
  - `artifacts/{appId}/users/{userId}/requests` - Private user requests
- **Authentication Flow**:
  1. Check for `__initial_auth_token` in global scope
  2. Use custom token if available
  3. Fall back to anonymous authentication
  4. Gate all operations behind `isAuthReady` state

## 📋 Application Views

### SkillList (Discovery)
- Grid view of available skills
- "Offer New Skill" modal for teachers
- Visual separation of user's own skills

### SkillDetail (Request)
- Detailed skill information
- Lesson request form
- Conditional interface for skill owners vs students

### Dashboard (Management)
- "My Requests" - student perspective
- "My Skills Offered" - teacher perspective
- Video call buttons for accepted requests
- Teacher notification limitations notice

## 🚨 Important Notes

- **Teacher Notifications**: Limited by Firestore security rules - teachers cannot automatically see incoming requests from other users
- **Video Calls**: Mock implementation only - requires real video service integration for production
- **Authentication**: Production should implement proper user management and custom token generation

## 🛠️ Development

The application is designed as a learning demonstration and follows the specifications from the planning document exactly. All features work with mock data and demonstrate proper React patterns, Firebase integration, and responsive design.

For detailed setup instructions, deployment options, and troubleshooting, see [SETUP.md](./SETUP.md).

## 📄 License

This project is provided as-is for educational purposes.