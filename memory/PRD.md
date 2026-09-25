# Cross Crafted - Product Requirements Document

## Overview
Cross Crafted is a modern, mobile-first Christian social platform combining Instagram/TikTok with Eventbrite. It features sharing testimonies (image/video posts), discovering/following churches, joining events, and connecting with believers.

## Tech Stack
- **Frontend**: React + TailwindCSS + Framer Motion + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Storage**: Emergent Object Storage
- **Auth**: Emergent-managed Google OAuth + Email/Password (JWT + Session tokens)
- **Email**: Resend (transactional emails)
- **Design**: Premium Dark Mode (#0F172A), Gen Z playful, mobile-first

## Core Features (Implemented)
- Unified social feed (posts, events, churches, products interwoven)
- Church discovery, profiles, follow system
- Event creation, RSVP, attendee tracking (free events only)
- Creator shop with product listings
- User profiles with posts, saved items, events tabs
- Admin dashboard with CRUD and RBAC
- Trending badges, suggested users carousel
- Infinite scroll with skeleton loading
- Auto-hiding mobile navigation
- Media-first feed (TikTok/Reels style, full bleed video/image)
- Video processing & streaming (chunked upload, ffmpeg thumbnails, HTTP Range)

## Authentication System (Implemented)
- **Google OAuth**: Emergent-managed Google Auth with redirect flow
- **Email/Password**: Registration with bcrypt hashing, JWT access+refresh tokens
- **Faith Questions**: 3 questions asked during signup/onboarding (faith_belief, faith_journey, church_member)
- **Multi-step Registration**: Faith Questions → Account Details → Location
- **Onboarding**: For Google Auth users - collects profile info + faith questions
- **Admin Approval**: New users get `pending_approval` status, admin reviews and approves/rejects
- **User Statuses**: needs_onboarding → pending_approval → active/rejected
- **Forgot Password**: Token-based password reset flow
- **Brute Force Protection**: Account lockout after 5 failed attempts
- **Session Management**: Cookie-based sessions with 7-day expiry

## Admin Panel Features (Implemented)
- **Dashboard**: 5 stat cards (Total Users, Pending Approvals, Total Churches, Total Events, Total Products)
- **Approvals**: Pending users list with faith profile, approve/reject buttons
- **Users**: List/search, role change, status change, delete user + cascade
- **Posts**: List/search, delete post, inline comment expansion with per-comment delete
- **Comments**: Dedicated page - flat list of all comments platform-wide, search, delete
- **Churches**: List/search, approve/reject/delete
- **Events**: List/search, delete event + registrations
- **Products**: List/search, delete product
- **Activity Logs**: Audit trail for all admin actions with filters
- **Access Control**: `require_admin` middleware (403 for non-admin API), frontend redirect

## India Location Support
- **36 Indian states/UTs** in dropdown (constants/india.js)
- **14 languages**: Hindi, English, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati, Punjabi, Bengali, Odia, Assamese, Urdu, Others
- **Multi-select** for languages (components/MultiSelect.js)
- **Filters** on Churches, Events, Explore pages (state, language, search)
- **Required** during registration (state, city, languages)

## Architecture
- Backend serves React SPA build from `/app/frontend/build`
- Health check at `/api/health`
- All API routes prefixed with `/api`
- Cookie-based auth (no Bearer tokens in production — avoids CORS cookie issues on custom domain)

## Completed Phases
- Phase 1-14: Full platform build (auth, feed, churches, events, shop, admin, explore, branding)
- Phase 15: Deployment readiness - SPA build, static serving, health check
- Phase 16: Code review fixes - Hook deps, component splitting, console cleanup
- Phase 17: Admin Panel - Full CRUD admin with dark premium theme
- Phase 18: Admin Activity Logs - Audit trail for all admin actions
- Phase 19: India Location & Language Support
- Phase 20: Authentication System - Google OAuth, faith questions, admin approval, forgot password, onboarding
- Phase 21: Email Integration (Resend) - Password reset emails, approval/rejection notifications, admin alerts
- Phase 22: Media-first feed redesign, video processing/streaming, mobile UI fixes
- Phase 23: Admin Posts Management (inline comments) & Comments Management (dedicated page) - Apr 8, 2026
- Phase 24: Pending Churches with Approve/Reject/Verify workflow and status filter tabs - Apr 8, 2026
- Phase 25: Verified Badges for users (pastors, celebrities, leaders) and churches — admin-controlled, displayed across feed, profiles, comments, church cards - Apr 8, 2026
- Phase 26: Unified Search across posts, churches, events, and users — debounced live search, tab-based filtering with counts, People/Churches list views - Apr 8, 2026
- Phase 27: Recently Searched keywords (up to 8, per-user, clickable chips on Explore) - Apr 8, 2026
- Phase 28: Notifications system — likes, comments, follows, admin actions, messages trigger notifications with type-based icons, unread badge, mark-all-read, 10s polling - Apr 8, 2026
- Phase 29: Real-time 1-on-1 DMs — conversations list, message sending with optimistic UI, 3s polling, New DM via user search, Message button on profiles - Apr 8, 2026
- Phase 30: Crown badge for admins (gold Crown icon), verified seed users (Sarah Mitchell, Marcus Johnson, Emily Rodriguez, Noah Parker) - Apr 8, 2026

## Backlog
### P0
- [ ] Modularize server.py into route files (2100+ lines)
- [ ] Verify crosscrafted.in domain in Resend for production emails (currently test mode sends only to admin)

### P1
- [ ] Followers/Following list pages
- [x] Search across posts/churches/events/users (Phase 26)

### P2
- [x] Notifications, Messaging (Phase 28-29)
