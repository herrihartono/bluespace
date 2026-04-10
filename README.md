# BlueSpace

A modern PWA social media application built with Next.js, Firebase, and Tailwind CSS.

## Features

- **Google Login** — Authentication via Google account
- **Profile Management** — Edit photo, username, display name, division, bio
- **Posts** — Create posts with text, photos, tag friends, tag groups, repost
- **Friend System** — Search users, send friend requests with notes, approve/decline
- **Chat** — Private messaging and group chats
- **PWA** — Installable as a Progressive Web App on mobile/desktop

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Firebase** (Auth, Firestore, Storage)
- **Tailwind CSS 4** (Blue-themed modern UI)
- **Zustand** (State management)
- **React Icons** (Icon library)

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** → Sign-in method → Google
3. Enable **Cloud Firestore** (Start in test mode)
4. Enable **Storage** (Start in test mode)

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.local.example .env.local
```

Get the values from Firebase Console → Project Settings → General → Your apps → Web app config.

### 3. Firestore Indexes

Create the following composite indexes in Firestore:

| Collection | Fields | Order |
|---|---|---|
| `friendRequests` | `toId` (Asc), `status` (Asc), `createdAt` (Desc) | — |
| `chats` | `members` (Array contains), `updatedAt` (Desc) | — |
| `messages` | `chatId` (Asc), `createdAt` (Asc) | — |
| `posts` | `createdAt` (Desc) | — |

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (main)/          # Authenticated pages with nav
│   │   ├── feed/        # Home feed with posts
│   │   ├── profile/     # Profile view & edit
│   │   ├── friends/     # Friend list & requests
│   │   ├── search/      # User search
│   │   └── chat/        # Chat list & rooms
│   ├── login/           # Google login page
│   └── layout.tsx       # Root layout with PWA meta
├── components/          # Reusable UI components
├── lib/                 # Firebase config & helpers
├── store/               # Zustand state stores
└── types/               # TypeScript interfaces
```
