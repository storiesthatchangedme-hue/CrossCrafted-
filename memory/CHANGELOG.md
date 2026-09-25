# Cross Crafted - Changelog

## Apr 8, 2026 - Phase 16: Code Review Fixes
### Critical Fixes
- **Hardcoded secrets removed** from 5 test files → replaced with `os.environ.get()` defaults
- **React hook dependencies fixed** in SocialFeed, UserProfile, Events, Shop, Home, ChurchProfile, EventDetail → wrapped async fetchers with `useCallback`, added proper deps arrays
- **Home.js initialization bug** fixed (fetchPosts called before useCallback defined it)

### Component Splitting
- **PostCard.js** extracted as shared component (67 lines) → used in UserProfile & ChurchProfile
- **EventCard.js** extracted as shared component (61 lines) → used in UserProfile & ChurchProfile
- UserProfile.js: 654 → 487 lines (-25%)
- ChurchProfile.js: 639 → 561 lines (-12%)

### Code Quality
- **All console.error/console.log removed** from 12 frontend files
- **Empty catch blocks** replaced with proper error handling (toast notifications)
- **Array index keys** replaced with stable identifiers in About, ForCreators, ForChurches, Contact, SocialFeed
- **ESLint warnings** resolved in ChurchProfile.js and EventDetail.js

## Apr 7, 2026 - Phase 15: Deployment Readiness
- Frontend production build created at `/app/frontend/build`
- Backend serves static assets + SPA catch-all for client-side routing
- Health check at `/api/health` returns JSON status
- Fixed Emergent badge overlapping mobile bottom nav
- Rebuilt production bundle with badge fix
