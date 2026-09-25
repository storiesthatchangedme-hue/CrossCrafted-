# Supabase + Google OAuth Setup Guide

This document explains exactly what you need to configure to make
Google Sign-In work with your CrossCrafted Supabase project.

---

## Step 1: Run the Database Migration

Open **Supabase Dashboard → SQL Editor** and run:

```
supabase/migrations/001_add_onboarding_fields.sql
```

This adds the `onboarding_complete` and `onboarding_draft_step` columns
to your `users` table, and makes `username` nullable so Google users
can be created before choosing a username in onboarding.

---

## Step 2: Enable Google Provider in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** in the list
3. Click **Enable**
4. You will see two fields:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
5. Do NOT fill these yet — complete Step 3 first, then come back.

---

## Step 3: Configure Google Cloud Console

### 3A. Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the **Google Identity** API if not already enabled

### 3B. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `CrossCrafted Web App`

### 3C. Authorized JavaScript Origins

Add these URLs:

```
http://localhost:3000
https://YOUR-VERCEL-DOMAIN
```

Replace `YOUR-VERCEL-DOMAIN` with your actual Vercel deployment URL
(e.g. `https://crosscrafted.vercel.app`).

### 3D. Authorized Redirect URI

Add **only** this URL:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

**Where to find `YOUR_PROJECT_REF`:**
- Go to **Supabase Dashboard** → **Settings** → **API**
- The project reference is in your **Project URL**
- Example: if your URL is `https://abcdef.supabase.co`,
  then `YOUR_PROJECT_REF` is `abcdef`
- So the full redirect URI would be:
  `https://abcdef.supabase.co/auth/v1/callback`

### 3E. Save and Copy Credentials

1. Click **Create**
2. Copy the **Client ID** and **Client Secret**
3. Go back to **Supabase Dashboard → Authentication → Providers → Google**
4. Paste the **Client ID** and **Client Secret**
5. Click **Save**

---

## Step 4: Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:

```
http://localhost:3000/auth/callback
https://YOUR-VERCEL-DOMAIN/auth/callback
```

Replace `YOUR-VERCEL-DOMAIN` with your actual Vercel URL.

---

## Step 5: Create Storage Bucket (for Avatar Uploads)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket**
3. Name: `avatars`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**

---

## Step 6: Configure Environment Variables

### Local Development (.env)

Create a `.env` file in the project root:

```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_BACKEND_URL=
```

Find the values in **Supabase Dashboard → Settings → API**.

### Vercel Deployment

In **Vercel Dashboard → Project → Settings → Environment Variables**, add:

| Variable | Production | Preview | Development |
|---|---|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase URL | Same | Same |
| `REACT_APP_SUPABASE_ANON_KEY` | Your anon key | Same | Same |
| `REACT_APP_BACKEND_URL` | Your backend URL | Same | Same |

---

## Step 7: Verify RLS Policies

The existing schema already has RLS policies for the `users` table:

- **SELECT**: Everyone can view all users
- **INSERT**: Only `auth.uid() = id` (user can insert own profile)
- **UPDATE**: Only `auth.uid() = id` (user can update own profile)

These are correct. Do NOT disable RLS.

---

## Testing Checklist

After completing all steps:

1. Start the dev server: `cd frontend && npm start`
2. Go to the Login page
3. Click "Sign In with Google"
4. You should be redirected to Google consent screen
5. After authorizing, you should land on `/auth/callback`
6. Then auto-redirect to `/onboarding`
7. Complete onboarding
8. You should land on `/app/feed`

If you get errors:
- **"Invalid redirect URL"** → Check Step 3C and Step 4
- **"Client ID not found"** → Check Step 2 and Step 3E
- **"Row Level Security"** → The policies are already set; check your Supabase project
- **"Column onboarding_complete does not exist"** → You skipped Step 1
