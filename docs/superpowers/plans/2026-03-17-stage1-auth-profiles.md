# Stage 1: Authentication, Profiles & Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can register (email or Google), pick a profile type, edit their profile, and see a dashboard. Chinese language available. Contact view tracking ready for future monetization.

**Architecture:** Keep existing NextAuth for auth (add Google provider). Create `profiles` table in Supabase for extended user data. Sync profile on login/register. Dashboard reads from Supabase profiles. Navigation shows auth state.

**Tech Stack:** NextAuth.js, Supabase (profiles table), Next.js App Router, next-intl, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-17-platform-roadmap-and-stage1-design.md`

---

## File Structure

### New Files

- `src/lib/supabase/profiles.ts` — Profile CRUD operations (read, update, create)
- `src/app/[locale]/auth/profile-setup/page.tsx` — Post-registration profile type selection
- `src/app/[locale]/dashboard/profile/page.tsx` — Edit profile page
- `src/app/[locale]/dashboard/verification/page.tsx` — Upload verification document
- `src/components/features/ProfileTypeSelector.tsx` — Profile type selection UI
- `src/components/features/ProfileForm.tsx` — Profile edit form
- `src/components/features/UserMenu.tsx` — Authenticated user dropdown in nav
- `src/messages/zh.json` — Chinese translations
- `supabase/migrations/001_create_profiles.sql` — Profiles table migration
- `supabase/migrations/002_create_contact_views.sql` — Contact views table

### Modified Files

- `src/lib/services/auth.config.ts` — Add Google provider, profile sync on login
- `src/app/api/auth/register/route.ts` — Create profile in Supabase after registration
- `src/components/layouts/NavigationSimple.tsx` — Add auth state UI (login/register/user menu)
- `src/lib/utils/i18n.config.ts` — Add 'zh' to locales
- `middleware.ts` — Add 'zh' locale, protect /dashboard routes
- `src/app/[locale]/dashboard/page.tsx` — Simplify, show profile summary
- `src/lib/supabase/database.types.ts` — Add profiles and contact_views types

---

## Chunk 1: Database & Auth Foundation

### Task 1: Create profiles table in Supabase

**Files:**

- Create: `supabase/migrations/001_create_profiles.sql`
- Modify: `src/lib/supabase/database.types.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/001_create_profiles.sql

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- matches NextAuth user ID
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'investor'
    CHECK (profile_type IN ('subsoil_user', 'service_provider', 'investor')),
  country TEXT DEFAULT 'Kazakhstan',
  company_name TEXT,
  phone TEXT,
  description TEXT,
  avatar_url TEXT,
  city TEXT,
  website TEXT,
  service_types TEXT[],
  contacts_viewed_count INTEGER DEFAULT 0,
  contacts_viewed_limit INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_document_url TEXT,
  is_trusted_seller BOOLEAN DEFAULT FALSE,
  listings_moderated_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_email ON profiles(email);
```

- [ ] **Step 2: Run the migration on Supabase**

Run via Supabase MCP tool or dashboard SQL editor.

- [ ] **Step 3: Create contact_views table**

```sql
-- supabase/migrations/002_create_contact_views.sql

CREATE TABLE IF NOT EXISTS contact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id TEXT NOT NULL,
  listing_id TEXT,
  seller_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_views_viewer ON contact_views(viewer_id);
CREATE INDEX idx_contact_views_seller ON contact_views(seller_id);
```

- [ ] **Step 4: Update database.types.ts**

Add to the `Database` interface in `src/lib/supabase/database.types.ts`:

```typescript
// Add to Tables interface:
profiles: {
  Row: {
    id: string;
    full_name: string;
    email: string;
    profile_type: 'subsoil_user' | 'service_provider' | 'investor';
    country: string | null;
    company_name: string | null;
    phone: string | null;
    description: string | null;
    avatar_url: string | null;
    city: string | null;
    website: string | null;
    service_types: string[] | null;
    contacts_viewed_count: number;
    contacts_viewed_limit: number | null;
    is_verified: boolean;
    verified_at: string | null;
    verification_document_url: string | null;
    is_trusted_seller: boolean;
    listings_moderated_count: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    full_name: string;
    email: string;
    profile_type?: 'subsoil_user' | 'service_provider' | 'investor';
    country?: string | null;
    company_name?: string | null;
    phone?: string | null;
    description?: string | null;
    avatar_url?: string | null;
    city?: string | null;
    website?: string | null;
    service_types?: string[] | null;
  };
  Update: Partial<{
    full_name: string;
    email: string;
    profile_type: 'subsoil_user' | 'service_provider' | 'investor';
    country: string | null;
    company_name: string | null;
    phone: string | null;
    description: string | null;
    avatar_url: string | null;
    city: string | null;
    website: string | null;
    service_types: string[] | null;
    verification_document_url: string | null;
  }>;
};
contact_views: {
  Row: {
    id: string;
    viewer_id: string;
    listing_id: string | null;
    seller_id: string | null;
    viewed_at: string;
  };
  Insert: {
    viewer_id: string;
    listing_id?: string | null;
    seller_id?: string | null;
  };
  Update: never;
};
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/supabase/database.types.ts
git commit -m "feat: add profiles and contact_views tables"
```

---

### Task 2: Profile service layer

**Files:**

- Create: `src/lib/supabase/profiles.ts`

- [ ] **Step 1: Create profiles service**

```typescript
// src/lib/supabase/profiles.ts
import { createClient } from './server';
import { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ProfileType = 'subsoil_user' | 'service_provider' | 'investor';

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function createProfile(
  profile: ProfileInsert
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert([profile])
    .select()
    .single();

  if (error) {
    console.error('Failed to create profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update profile:', error);
    return null;
  }
  return data;
}

export async function trackContactView(
  viewerId: string,
  sellerId: string,
  listingId?: string
): Promise<void> {
  const supabase = await createClient();
  await (supabase as any).from('contact_views').insert([
    {
      viewer_id: viewerId,
      seller_id: sellerId,
      listing_id: listingId || null,
    },
  ]);

  // Increment counter on viewer profile
  await (supabase as any).rpc('increment_contact_views', { user_id: viewerId });
}

export async function hasProfileSetup(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile !== null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/profiles.ts
git commit -m "feat: add profile service layer"
```

---

### Task 3: Add Google OAuth to NextAuth

**Files:**

- Modify: `src/lib/services/auth.config.ts`
- Modify: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Read current auth.config.ts and add Google provider**

Add GoogleProvider to the providers array. Keep existing Credentials provider.

```typescript
// Add to imports:
import GoogleProvider from 'next-auth/providers/google';

// Add to providers array (alongside existing CredentialsProvider):
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
}),
```

- [ ] **Step 2: Add profile sync in NextAuth callbacks**

In the `signIn` callback, create/update Supabase profile when user logs in:

```typescript
// In callbacks.signIn or callbacks.jwt:
import { getProfile, createProfile } from '@/lib/supabase/profiles';

// After successful sign-in, ensure profile exists:
async signIn({ user, account }) {
  if (user.id && user.email) {
    const existing = await getProfile(user.id);
    if (!existing) {
      await createProfile({
        id: user.id,
        full_name: user.name || '',
        email: user.email,
        profile_type: 'investor', // default, user changes in profile-setup
      });
    }
  }
  return true;
}
```

- [ ] **Step 3: Update register route to create Supabase profile**

In `src/app/api/auth/register/route.ts`, after creating the Prisma user, also create a Supabase profile:

```typescript
import { createProfile } from '@/lib/supabase/profiles';

// After Prisma user creation:
await createProfile({
  id: newUser.id,
  full_name: name,
  email: email,
  profile_type: 'investor', // default
});
```

- [ ] **Step 4: Add env vars to .env.local**

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/auth.config.ts src/app/api/auth/register/route.ts
git commit -m "feat: add Google OAuth and profile sync on login"
```

---

## Chunk 2: Profile Setup & Dashboard UI

### Task 4: Profile type selection page (post-registration)

**Files:**

- Create: `src/components/features/ProfileTypeSelector.tsx`
- Create: `src/app/[locale]/auth/profile-setup/page.tsx`

- [ ] **Step 1: Create ProfileTypeSelector component**

```typescript
// src/components/features/ProfileTypeSelector.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

const PROFILE_TYPES = [
  {
    id: 'subsoil_user' as const,
    icon: '⛏️',
    titleKey: 'profile.type.subsoilUser',
    descKey: 'profile.type.subsoilUserDesc',
  },
  {
    id: 'service_provider' as const,
    icon: '🔧',
    titleKey: 'profile.type.serviceProvider',
    descKey: 'profile.type.serviceProviderDesc',
  },
  {
    id: 'investor' as const,
    icon: '💼',
    titleKey: 'profile.type.investor',
    descKey: 'profile.type.investorDesc',
  },
];

export default function ProfileTypeSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_type: selected }),
      });
      router.push(`/${locale}/dashboard`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('profile.setup.title')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t('profile.setup.subtitle')}
      </p>
      <div className="grid gap-4">
        {PROFILE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelected(type.id)}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              selected === type.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{type.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t(type.titleKey)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t(type.descKey)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="mt-8 w-full py-3 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? t('common.loading') : t('common.continue')}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create profile-setup page**

```typescript
// src/app/[locale]/auth/profile-setup/page.tsx
import ProfileTypeSelector from '@/components/features/ProfileTypeSelector';
import NavigationSimple from '@/components/layouts/NavigationSimple';

export default function ProfileSetupPage() {
  return (
    <>
      <NavigationSimple />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
        <ProfileTypeSelector />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create API route for profile setup**

Create `src/app/api/profile/setup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateProfile } from '@/lib/supabase/profiles';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile_type } = await request.json();
  if (
    !['subsoil_user', 'service_provider', 'investor'].includes(profile_type)
  ) {
    return NextResponse.json(
      { error: 'Invalid profile type' },
      { status: 400 }
    );
  }

  const userId = (session.user as any).id;
  const profile = await updateProfile(userId, { profile_type });

  return NextResponse.json({ profile });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/features/ProfileTypeSelector.tsx src/app/[locale]/auth/profile-setup/ src/app/api/profile/
git commit -m "feat: add profile type selection after registration"
```

---

### Task 5: Profile edit form in dashboard

**Files:**

- Create: `src/components/features/ProfileForm.tsx`
- Create: `src/app/[locale]/dashboard/profile/page.tsx`
- Create: `src/app/api/profile/route.ts`

- [ ] **Step 1: Create ProfileForm component**

A form with fields: full_name, company_name, phone, city, country, website, description.
For service_providers: additional service_types checkboxes.
Avatar upload button (uses existing Supabase storage).
Save button calls `PUT /api/profile`.

Key aspects:

- Uses `react-hook-form` (already in dependencies)
- Loads current profile data on mount via `GET /api/profile`
- Shows service_types checkboxes only if profile_type === 'service_provider'
- Gray+blue design system (as per CLAUDE.md)

- [ ] **Step 2: Create profile API route**

`src/app/api/profile/route.ts`:

- `GET` — returns current user's profile from Supabase
- `PUT` — updates current user's profile in Supabase
- Both require NextAuth session

- [ ] **Step 3: Create dashboard profile page**

`src/app/[locale]/dashboard/profile/page.tsx`:

- Renders NavigationSimple + ProfileForm
- Shows verification status badge

- [ ] **Step 4: Commit**

```bash
git add src/components/features/ProfileForm.tsx src/app/[locale]/dashboard/profile/ src/app/api/profile/route.ts
git commit -m "feat: add profile edit page in dashboard"
```

---

### Task 6: Update navigation with auth state

**Files:**

- Create: `src/components/features/UserMenu.tsx`
- Modify: `src/components/layouts/NavigationSimple.tsx`

- [ ] **Step 1: Create UserMenu component**

```typescript
// src/components/features/UserMenu.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (status === 'loading') return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/auth/login`}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          {t('nav.login')}
        </Link>
        <Link href={`/${locale}/auth/register`}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {t('nav.register')}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {session.user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
          {session.user?.name}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <Link href={`/${locale}/dashboard`} onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            {t('nav.dashboard')}
          </Link>
          <Link href={`/${locale}/dashboard/profile`} onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            {t('nav.profile')}
          </Link>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <button onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Integrate UserMenu into NavigationSimple**

Replace the existing static user icon button with `<UserMenu />`. Import and render it in the header's right section.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/UserMenu.tsx src/components/layouts/NavigationSimple.tsx
git commit -m "feat: add auth-aware navigation with user menu"
```

---

## Chunk 3: Languages, Middleware & Polish

### Task 7: Add Chinese locale

**Files:**

- Create: `src/messages/zh.json`
- Modify: `src/lib/utils/i18n.config.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Create zh.json**

Copy structure from `en.json`, translate all values to Chinese. Must include all existing keys plus new profile-related keys:

New keys to add to ALL locale files (ru, en, kz, zh):

```json
{
  "nav": {
    "login": "Login / Войти / Кіру / 登录",
    "register": "Register / Регистрация / Тіркелу / 注册",
    "logout": "Logout / Выйти / Шығу / 退出",
    "profile": "Profile / Профиль / Профиль / 个人资料"
  },
  "profile": {
    "setup": {
      "title": "Choose your role / Выберите роль / Рөліңізді таңдаңыз / 选择您的角色",
      "subtitle": "..."
    },
    "type": {
      "subsoilUser": "Subsoil User / Недропользователь / Жер қойнауын пайдаланушы / 矿产权持有者",
      "subsoilUserDesc": "...",
      "serviceProvider": "Service Provider / Поставщик услуг / Қызмет көрсетуші / 服务提供商",
      "serviceProviderDesc": "...",
      "investor": "Investor / Инвестор / Инвестор / 投资者",
      "investorDesc": "..."
    }
  }
}
```

- [ ] **Step 2: Add 'zh' to i18n config**

In `src/lib/utils/i18n.config.ts`, add `'zh'` to the locales array.

- [ ] **Step 3: Add 'zh' to middleware locale list**

In `middleware.ts`, add `'zh'` to the supported locales array.

- [ ] **Step 4: Verify all 4 locales work**

```bash
npm run dev
# Visit /zh, /ru, /en, /kz — all should render
```

- [ ] **Step 5: Commit**

```bash
git add src/messages/zh.json src/lib/utils/i18n.config.ts middleware.ts src/messages/ru.json src/messages/en.json src/messages/kz.json
git commit -m "feat: add Chinese locale and profile translation keys"
```

---

### Task 8: Protect dashboard routes

**Files:**

- Modify: `middleware.ts`

- [ ] **Step 1: Add auth check for /dashboard routes**

In `middleware.ts`, check for NextAuth session token cookie when path starts with `/{locale}/dashboard`. If no session, redirect to `/{locale}/auth/login`.

```typescript
// In middleware, after locale handling:
const isDashboard = pathname.includes('/dashboard');
if (isDashboard) {
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;
  if (!sessionToken) {
    const locale = pathname.split('/')[1] || 'ru';
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }
}
```

- [ ] **Step 2: Test**

- Visit `/ru/dashboard` without being logged in → should redirect to `/ru/auth/login`
- Login → visit `/ru/dashboard` → should work

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect dashboard routes with auth check"
```

---

### Task 9: Simplify dashboard landing page

**Files:**

- Modify: `src/app/[locale]/dashboard/page.tsx`

- [ ] **Step 1: Simplify dashboard to show profile summary**

Replace the current complex analytics dashboard with a simple personal dashboard:

- Welcome message with user name
- Profile completion progress (how many fields filled)
- Quick links: Edit Profile, My Listings (placeholder), Verification
- Contact views counter
- Profile type badge

Keep it simple — gray + blue, no complex charts. This is the user's home base.

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/page.tsx
git commit -m "feat: simplify dashboard to personal home page"
```

---

### Task 10: Build verification & deploy

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Test locally**

```bash
npm run dev
```

Test flow:

1. Register with email → profile-setup page → select type → dashboard
2. Edit profile → save → verify data persists
3. Navigation shows user menu when logged in
4. Switch to Chinese → all text renders
5. Logout → dashboard redirects to login

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: Stage 1 complete — auth, profiles, dashboard, 4 languages"
git push origin master
```

- [ ] **Step 5: Verify Vercel deploy**

```bash
npx vercel --prod --yes
```

---

## Summary

| Task | What                            | Files                           |
| ---- | ------------------------------- | ------------------------------- |
| 1    | Profiles + contact_views tables | Supabase migration + types      |
| 2    | Profile service layer           | profiles.ts                     |
| 3    | Google OAuth + profile sync     | auth.config.ts + register route |
| 4    | Profile type selection          | ProfileTypeSelector + page      |
| 5    | Profile edit form               | ProfileForm + API + page        |
| 6    | Auth-aware navigation           | UserMenu + NavigationSimple     |
| 7    | Chinese locale                  | zh.json + i18n config           |
| 8    | Dashboard route protection      | middleware.ts                   |
| 9    | Dashboard landing page          | dashboard/page.tsx              |
| 10   | Build verification & deploy     | full build + Vercel             |
