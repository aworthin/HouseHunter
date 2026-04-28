# HomeQuest — House Hunter App

A mobile-first PWA for tracking, touring, and ranking houses during your home search.

## Features
- Add houses via Zillow URL (auto-pulls listing details)
- View house details with image gallery
- Tour Mode to capture impressions during visits
- Drag-and-drop ranking of toured houses
- Real-time sync across all devices (Firebase)
- Installable on iPhone/iPad home screen (PWA)

---

## Setup

### 1. Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (start in test mode)
4. Go to Project Settings → Your Apps → Add Web App
5. Copy the config values

### 2. Environment Variables

```bash
cp .env.example .env
# Fill in your Firebase config values
```

### 3. Firestore Security Rules (Important!)

In Firebase Console → Firestore → Rules, set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /houses/{document} {
      allow read, write: if true;  // No auth - private app
    }
  }
}
```

---

## Running Locally

```bash
npm install
npm run dev
```

The scraper runs via Netlify Dev locally. Install `netlify-cli` for full local testing:

```bash
npm install -g netlify-cli
netlify dev
```

---

## Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

---

## Deploy with Docker

```bash
# Copy and fill in your env file
cp .env.example .env

# Build and run
docker-compose up -d

# App available at http://localhost:3001
```

---

## Install on iPhone/iPad

1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

The app will appear as a full-screen native-feeling app.

---

## Adding More Fields

To add fields to the house data model:

1. **Zillow fields**: Edit `netlify/functions/scrape.js` and `server/index.js` — add to the returned object
2. **Tour fields**: Edit `src/pages/TourModePage.jsx` — add inputs and include in `updateHouse()` call
3. **Display**: Edit `src/pages/HouseDetailPage.jsx` — add `<InfoRow>` components
4. **Edit form**: Edit `src/pages/EditHousePage.jsx` — add form fields

No database migrations needed — Firestore is schema-free.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: Firebase Firestore (real-time, shared)
- **Scraper**: Netlify Functions / Express.js
- **Drag & Drop**: dnd-kit (touch-optimized)
- **PWA**: Manifest + viewport meta tags
