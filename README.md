# Pulse — Next.js + Supabase

Marketing toolkit for healthcare sales teams: landing page + app shell with Supabase-ready auth and database structure.

## What’s included

- **Landing page** (`/`) — Hero, toolkit, distribution, problem/solution, stats, HCP section, final CTA, footer, and “Request Demo” / “Register” modals (converted from your HTML).
- **App** — Role-based dashboards:
  - **Login** (`/login`) — Choose role (Manager, Sales Rep, Healthcare Pro) and continue to dashboard.
  - **Dashboard** (`/dashboard`) — Manager, Rep, or Pro view with placeholder stats and panels (matches your app prototype).

Auth is currently **sessionStorage + role selection**. Supabase client/server and middleware are wired so you can plug in real sign-in and profile-based roles next.

## Setup

1. **Install dependencies**

   ```bash
   cd pulse-app
   npm install
   ```

2. **Supabase (optional for now)**

   - Create a project at [supabase.com](https://supabase.com).
   - In **Settings → API**, copy **Project URL** and **anon public** key.
   - Copy `.env.local.example` to `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   The app runs without these; add them when you’re ready to use Supabase Auth and database.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/login](http://localhost:3000/login) for the app.

## Project structure

```
pulse-app/
├── app/
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Design tokens, Tailwind
│   ├── (auth)/
│   │   └── login/page.tsx  # Login + role selection
│   └── (dashboard)/
│       └── dashboard/page.tsx  # Role-based dashboard
├── components/
│   ├── landing/            # Landing sections + modals
│   └── ui/                 # Container, etc.
├── lib/
│   └── supabase/           # createClient (browser, server), middleware
├── types/
│   └── database.ts         # UserRole, UserProfile
├── .env.local.example
└── tailwind.config.ts      # Pulse colors, fonts, radii
```

## Next steps

- **Supabase Auth** — Replace sessionStorage role with `supabase.auth.getUser()` and redirect unauthenticated users from `/dashboard` and `/login` as needed.
- **Database** — Add tables (e.g. `profiles` with `role`, `company`, `credits`) and Row Level Security; read/write from server actions or API routes.
- **Landing forms** — Post “Request Demo” and “Register” to Supabase (e.g. `demo_requests`, `profiles` or `leads`) or your backend.
