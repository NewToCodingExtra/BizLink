# BizLink User Usage Context

## 1. Overview
BizLink is an interactive platform connecting businesses, suppliers, and franchisers. The platform features dynamic feeds, interactive media (Stories/Reels), direct messaging, and polling to facilitate business networking and collaboration.

## 2. User Roles & Permissions
- **Guest:** Unauthenticated. Can browse public content, perform searches, and view profiles.
- **Authenticated User (Customer/Supplier):** Can interact (like, save, comment, inquire), manage their profile, follow others, and participate in polls.
- **Administrator/Manager:** Elevated status. Identified by badges on profiles (`Admin` / `Brand`).

## 3. Core Functional Areas

### A. Discovery & Feed
- **Home Feed:** Displays a mix of opportunities.
    - **Filtering:** Filter opportunities by type (e.g., specific business categories).
    - **Interaction:** Like, Save/Bookmark, Comment, or Inquire about an opportunity.
    - **Infinite Scroll:** Loads content dynamically as you scroll.
- **Reels:** A dedicated, immersive video feed.
    - **Navigation:** Snap-scrolling layout.
    - **Interaction:** Like reels, open comment threads, or inquire directly from a reel.
    - **Deep Linking:** Reels are linkable via slugs (e.g., from profiles).

### B. Stories & Polls
- **Stories Bar:** Displays active, branded stories.
    - **Interaction:** Create stories via the dedicated modal (if authorized). Tap branded stories to view.
- **Polls:** Interactive widgets on opportunities.
    - **Voting:** Cast votes on questions.
    - **Management:** Creators can close their own polls.

### C. Profiles & Networking
- **Profile Page:**
    - **Tabs:** Toggle between all **Posts** and video-only **Reels**.
    - **Networking:** Follow/Unfollow users.
    - **Info:** View bio, stats (posts/stories), and brand badges.
    - **Edit:** Own profile management (update bio, avatar, etc.).
- **Search:** Global search available for finding specific content or users.

### D. Consultation & Messaging
- **Inquiry Workflow:** Tapping **Inquire** initiates a private consultation thread.
- **Messages Inbox:** Central hub for all buyer–seller interactions.
    - **Live Updates:** Uses Laravel Echo for real-time notifications on new inquiries/messages.
    - **Context:** Private messages are distinct from public comments.

---
*Note: BizLink uses role-based access control (RBAC). UI components or actions that require specific permissions are guarded by the `can()` helper; therefore, certain buttons or features may only appear if authorized.*
