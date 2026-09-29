# Quality Test Progress

## Current Issues (from Lint)

### Critical (Must Fix)
- [ ] `src/Pages/OpportunityDetail.jsx`: Fix conditional hook calls.
- [ ] `src/components/Navbar.jsx`: Fix conditional hook calls.
- [ ] `src/components/OpportunityCard.jsx`: Fix conditional hook calls.

### Warnings/Improvement Needed
- [ ] `src/Layouts/AppLayout.jsx`: Fix synchronous state update in effect.
- [ ] `src/Pages/ResetPassword.jsx`: Remove unused variables (`mismatch`, `setMismatch`).
- [ ] `src/components/BusinessFeatures.jsx`: Remove unused `useMemo` import.
- [ ] `src/components/PreferenceOnboardingModal.jsx`: Fix synchronous state update in effect; fix missing dependency (`user`) in useEffect.
- [ ] `src/components/SearchBar.jsx`: Fix missing dependency (`onSearch`); fix unused expression.
- [ ] `src/components/CommentTree.jsx`: Fix unused variables (`postId`, `postSlug`); fix unused expressions.
- [ ] `src/Pages/MessagesInbox.jsx`: Fix missing dependency (`user`).
- [ ] `src/Pages/Reels.jsx`: Fix missing dependency (`toast`).
- [ ] `src/components/Navbar.jsx`: Fix unused `flash`; fix synchronous state update in effect; fix missing dependency (`user`).
- [ ] `src/components/ContactForm.jsx`: Fix unused expression.
- [ ] `src/components/ProfileMenu.jsx`: Fix synchronous state update in effect.
- [ ] `src/components/StoriesBar.jsx`: Fix impure function `Date.now` during render.
- [ ] `src/Pages/HomeFeed.jsx`: Fix unused parameter (`preferences`); fix unused catch parameter (`err`); fix missing dependency (`toast`).
- [ ] `src/Pages/Profile.jsx`: Remove unused variables (`setStories`, `error`, `setError`).
- [ ] `src/Pages/StoryViewer.jsx`: Fix impure function `Date.now` during render; fix synchronous state updates in effects.
- [ ] `src/Pages/MessageThread.jsx`: Remove unused `res`; fix impure function `Date.now` during render; fix missing dependencies (`me.name`, `conv`).

## Progress Tracker
- [ ] Initial Scan: Completed.
- [ ] Fix Critical Lint Issues: Pending.
- [ ] Fix Warnings/Improvements: Pending.
- [ ] Final Verification (Manual): Pending.
