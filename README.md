# BuseLink — Frontend Only

Vite + React + Tailwind CSS v4 (no backend).

```
BuseLink/
└── frontend/   # Vite + React + Tailwind CSS v4
    ├── src/
    │   ├── components/        # Reusable components (Navbar, etc.)
    │   ├── pages/Home.jsx     # Example page
    │   ├── App.jsx
    │   └── index.css          # @import "tailwindcss"
    ├── vite.config.js         # @tailwindcss/vite + react
    └── package.json
```

## Prerequisites
- Node 18+ (tested 24), npm 10+

## Quick Start

```powershell
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # production
npm run preview # preview build
```

## Notes
- Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js` needed, `@import "tailwindcss"` in `index.css`).
- No backend required for this activity — all frontend only. Previously removed: `backend/` (Laravel), `src/api/client.js`, `VITE_API_URL` env and `/api` proxy.
