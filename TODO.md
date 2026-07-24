# Production Readiness TODO

Current estimate: ~70% production ready. Core loop (auth, profiles, listings, collab requests, chat) works. RLS and auth guards confirmed working.

---

## Critical - fix before launch

- [x] **Supabase RLS (Row Level Security)** - verified, users cannot access or mutate other societies' data
- [x] **Auth guards on protected routes** - confirmed, unauthenticated users are redirected to `/login`

- [x] **Fix base64 image uploads**
  - Currently sending raw base64 strings which hits Supabase payload limits at scale
  - Switch to multipart `File` upload directly to Supabase Storage

- [x] **Add React error boundaries**
  - One unhandled JS error currently crashes the entire app to a blank screen
  - Wrap routes in an error boundary with a friendly fallback UI

- [ ] **Terms of Service & Privacy Policy**
  - Legally required before going public
  - Minimum: what data you collect, how it's used, user rights

---

## Important - address soon after launch

- [x] **Live chat (1-on-1 and group)**
  - Big feature gap for a "collaboration" platform
  - Supabase Realtime supports this natively - see earlier discussion for schema

- [ ] **Email notifications**
  - Notify users of new collab requests and chat messages when offline
  - Supabase Edge Function + Resend - see earlier discussion for flow

- [ ] **Society verification**
  - Anyone can sign up as any society name with no validation
  - At minimum: email domain check (e.g. must be a UNSW email) or manual approval flow

- [ ] **Onboarding flow**
  - New users land on a blank profile with no guidance on what to fill out
  - Add a post-signup wizard: society name → type → description → socials

- [ ] **Mobile testing**
  - Tailwind responsive classes are in place but needs end-to-end testing on real devices
  - Especially: chat, collab requests panel, listing cards

---

## Nice to have - post-launch

- [ ] Group chats for multi-society collabs
- [ ] Event calendar view (not just list)
- [ ] Society directory / search page (browse all societies, not just listings)
- [ ] Analytics (Plausible or Umami - lightweight, privacy-friendly)
- [ ] Collab history page improvements (timeline, export)
- [ ] Listing expiry (auto-hide past-date listings from the DB, not just client-side)
- [ ] Rate limiting on collab requests (prevent spam)
- [ ] Pagination on listings - not urgent at current scale (~200-300 rows for 100 societies), revisit past 1,000+ listings
- [ ] Whern creating a listing, scan through the amount of events that are happening on the same week and give a popup be like hery this is a little busy this week maybe another week.
- [ ] in the filters if i select social, and there are no faculty sessions, make that entire filter option greyed out and vice versa