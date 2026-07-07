# Vuka — Frontend Design Specification v2.0

> **Persona:** Senior UI/UX Designer & Senior Frontend Developer  
> **Framework:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui  
> **Design:** Mobile-first, desktop-enhanced — every component specified with all states

---

## 1. Design System

### 1.1 Tokens

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8611A',  // burnt orange
          50:  '#FEF3ED',
          100: '#FDE8D8',
          200: '#FBD1B0',
          300: '#F8B989',
          400: '#F5A261',
          500: '#E8611A',
          600: '#C04F12',
          700: '#983C0D',
          800: '#702A08',
          900: '#481704',
        },
        dark:  '#1A1A1A',
        body:  '#4B5563',
        muted: '#9CA3AF',
        border: '#E5E7EB',
        surface: '#FAFAFA',
        card:  '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error:  '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '8px',
        btn:   '6px',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
}
```

### 1.2 Typography Scale

| Element | Tag | Size | Weight | Colour |
|---------|-----|------|--------|--------|
| Display | h1 | text-3xl md:text-5xl | font-bold | #1A1A1A |
| Heading 1 | h2 | text-2xl md:text-3xl | font-semibold | #1A1A1A |
| Heading 2 | h3 | text-xl md:text-2xl | font-semibold | #1A1A1A |
| Subheading | h4 | text-lg md:text-xl | font-medium | #1A1A1A |
| Body | p | text-base | font-normal | #4B5563 |
| Small | span | text-sm | font-normal | #6B7280 |
| Caption | span | text-xs | font-normal | #9CA3AF |

### 1.3 Component Primitives (shadcn/ui)

All use default shadcn/ui styling with overridden `--primary`:

```
--primary: 232 97 26     // #E8611A
--primary-foreground: 255 255 255
--secondary: 26 26 26    // #1A1A1A
--secondary-foreground: 255 255 255
--muted: 154 163 175     // #9CA3AF
--accent: 243 244 246
--destructive: 239 68 68 // #EF4444
--border: 229 231 235
--input: 229 231 235
--ring: 232 97 26
--radius: 0.5rem
```

Components used: `Button`, `Input`, `Badge`, `Card`, `Avatar`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Switch`, `Slider`, `Skeleton`, `Toast`, `Tooltip`, `Separator`, `Progress`, `Stepper` (custom), `EmptyState` (custom).

### 1.4 Verified Badge

```tsx
// components/ui/verified-badge.tsx
interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Orange shield with white checkmark (isVerified=true)
// Grey shield (isVerified=false, trainer exists but unverified)
// Hidden if no trainer profile
```

**Sizes:** sm=16px, md=20px, lg=24px. Rendered inline next to trainer name. Tooltip shown on hover: "Verified identity & skills" / "Not yet verified".

---

## 2. Route Structure

```
/                                    → Public Homepage (SSR)
/trainers                            → Trainer Listing (SSR + ISR)
/trainer/[slug]                      → Trainer Profile (SSR)
/course/[slug]                       → Course Detail (SSR)

/auth/login                          → Login Page
/auth/register                       → Register Page

/dashboard/trainee                   → Trainee Overview
/dashboard/trainee/enrolments        → My Enrolments
/dashboard/trainee/enrolments/[id]   → Enrolment Detail

/dashboard/trainer                   → Trainer Overview
/dashboard/trainer/courses           → Course Management
/dashboard/trainer/courses/new       → Create Course
/dashboard/trainer/courses/[id]      → Edit Course
/dashboard/trainer/enrolments        → Enrolment Management
/dashboard/trainer/enrolments/[id]   → Enrolment Detail (trainer view)
/dashboard/trainer/earnings          → Earnings & Payouts
/dashboard/trainer/verification      → Verification Flow

/dashboard/admin                     → Admin Overview
/dashboard/admin/verifications       → Verification Queue
/dashboard/admin/disputes            → Dispute Management
/dashboard/admin/disputes/[id]       → Dispute Detail
/dashboard/admin/transactions        → Transaction Ledger
/dashboard/admin/users               → User Management

/trust                               → Trust & Safety Page
/privacy                             → Privacy Policy
/terms                               → Terms of Service
```

---

## 3. Component Tree

```
<RootLayout>
  <QueryProvider>           // TanStack Query
    <ToastProvider />
    <AuthProvider />        // JWT in cookies, auto-refresh
    {children}
  </QueryProvider>
</RootLayout>

<PublicLayout>              // Navbar + Footer
  <TopNavigation>
    <Logo />
    <NavLinks />            // Trainers, How it Works, Trust
    <AuthButtons />         // Login / Register / Avatar dropdown
    <MobileMenu />          // Sheet
  </TopNavigation>
  {children}
  <Footer />
</PublicLayout>

<DashboardLayout>           // Sidebar + Header
  <DashboardSidebar>        // Desktop, collapsible
    <Logo mark />
    <NavItem /> * N         // Active state highlighted primary
  </DashboardSidebar>
  <MobileBottomNav />       // < 640px, 5 tabs
  <DashboardHeader>
    <Breadcrumb />
    <UserAvatarDropdown />
  </DashboardHeader>
  <main>{children}</main>
</DashboardLayout>
```

---

## 4. Page-by-Page Specification

### 4.1 Homepage — `/`

#### Hero Section

```
+--------------------------------------------------+
|  [subtle gradient orange-white]                   |
|                                                    |
|  Learn from Africa's best. Pay safely.             |
|  Vuka today.                                       |
|                                                    |
|  Master practical skills with vetted trainers.     |
|  Your money is held until training happens.        |
|                                                    |
|  [Find a Trainer]  [Become a Trainer]              |
|                                        [Illus]     |
+--------------------------------------------------+
```

- **Heading:** `text-3xl md:text-5xl font-bold text-dark max-w-2xl`
- **Subhead:** `text-lg text-body max-w-xl`
- **CTAs:** Two buttons stacked on mobile, side-by-side `md:flex-row`. Primary (orange) + Secondary (outline).
- **Illustration:** Desktop-only (hidden `max-md:hidden`). SVG person crossing bridge.
- **States:** Static SSR — no loading state needed.

#### How It Works Section

```
+---------------------------------------------------+
|  How It Works                                      |
|                                                    |
|  [1] Browse    [2] Pay Securely    [3] Learn       |
|  ─────────    ────────────────    ────────         |
|  Find the     M-Pesa holds        Attend           |
|  perfect      your payment        physical or      |
|  skill                            virtual          |
|                                                    |
|              [4] Confirm & Release                  |
|              ──────────────────────                |
|              Trainer gets paid                      |
|              after you confirm                     |
+---------------------------------------------------+
```

- **State:** Static SSR. Horizontal scroll `overflow-x-auto snap-x snap-mandatory` on mobile, 4-column `md:grid-cols-4` on desktop.
- **Each step:** Icon (lucide), number badge, title, description.

#### Popular Categories

- Grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`.
- Each card: emoji icon (48px), category name, "Browse →" link.
- **Categories:** Baking & Cake Decoration, Photography & Videography, Programming & Web Dev, Fitness & Wellness, Music & Instruments, Languages.

#### Featured Trainers

- SSR data fetching via `fetch(`${API_URL}/trainers?verifiedOnly=true&sortBy=rating&perPage=4`)`.
- Horizontal scroll `flex overflow-x-auto gap-4` with TrainerCard.
- **Loading:** Skeleton cards (4 `h-64 w-56 rounded-card bg-gray-100 animate-pulse`).

#### Trust Banner

- Full-width `bg-primary` strip. Single row: shield icon + text + "Learn more" link.

#### Final CTA Section

- Heading + primary button "Get Started" -> `/trainers`.

### 4.2 Trainer Listing — `/trainers`

#### Query Parameters (client-side, managed via URLSearchParams)

```
search     : string        → q
category   : string        → category
mode       : ALL|PHYSICAL|VIRTUAL → mode
minPrice   : number        → minPrice
maxPrice   : number        → maxPrice
verifiedOnly : boolean     → verifiedOnly
sortBy     : rating|price_asc|price_desc|newest → sortBy
page       : number        → page (default 1)
perPage    : number        → perPage (default 20)
```

#### Filter Bar

```
+--------------------------------------------------+
| [🔍 Search...] [Category ▼] [Mode: All ▼]        |
|                                                    |
| [Price: KES 100 ─────●───── KES 10000]            |
|                                                    |
| [✓ Verified only]   [Sort by: Rating ▼]           |
|                                                    |
| Filters: ["Baking ✕"] ["KES 500-5000 ✕"]         |
+--------------------------------------------------+
```

- **Active filter chips:** `Badge variant="outline"` with `X` button. Removing a chip resets that param and refetches.

#### TrainerCard

```
+---------------------------+
|  [Avatar]  Name  [✓]     |
|                           |
|  #Baking  #Cakes          |
|                           |
|  ★★★★☆ (45)              |
|  From KES 2,000           |
|                           |
|  [View Profile]           |
+---------------------------+
```

**Props:** `{ trainer: TrainerPublic }`  
**States:**
- **Default:** as above
- **Unverified:** grey shield instead of orange
- **Loading:** Skeleton — `h-72 w-full rounded-card bg-gray-100 animate-pulse`

```typescript
interface TrainerPublic {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  skills: string[];
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  startingPrice: number; // min course price
}
```

#### States

| State | Component | Behaviour |
|-------|-----------|-----------|
| **Loading** | 6x `SkeletonCard` | Shimmer placeholders in grid |
| **Empty** | `EmptyState` | `icon={Search}`, title: "No trainers found", subtitle: "Try adjusting your filters", action: "Clear Filters" |
| **Error** | `EmptyState` | `icon={AlertCircle}`, title: "Something went wrong", subtitle: "Please try again", action: "Retry" |
| **Success** | Grid + Pagination | Data displayed with page controls |

### 4.3 Trainer Profile — `/trainer/[slug]`

#### Header Section

```
+------------------------------------------------------+
|  [Cover Image — optional, fallback bg-gray-100]       |
|                                                        |
|       [Avatar 96px circular]                           |
|       Name [✓ verified]                                |
|                                                        |
|  👥 120 students  |  📚 5 courses  |  ⭐ 4.8 (45)      |
|                                                        |
|  [Share Profile]                                       |
+------------------------------------------------------+
```

#### Data Fetching

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['trainer', slug],
  queryFn: () => api.get(`/api/v1/trainers/${slug}`),
})

// Parallel queries for courses and reviews
const courses = useQuery(['trainer-courses', trainerId], ...)
const reviews = useQuery(['trainer-reviews', trainerId, page], ...)
```

#### Sections

- **About:** Collapsible text if > 200 chars. "Show more" link.
- **Skills:** `flex flex-wrap gap-2` with `Badge variant="secondary"`.
- **Courses:** List of CourseCard (grid `md:grid-cols-2 lg:grid-cols-3`).
- **Reviews:** Average rating + bar chart + paginated review list.

#### CourseCard

```
+------------------------------------+
| [Image]                    [PHYS] |
|                                    |
|  Title of the Course               |
|  4 weeks, 8 sessions              |
|  ★★★★☆                           |
|  KES 5,000                         |
|                                    |
|  [View Course]                     |
+------------------------------------+
```

#### States

| State | Behaviour |
|-------|-----------|
| **Loading** | Full page skeleton with header skeleton, course card skeletons (3), review skeletons (3) |
| **Not found** | `EmptyState` "Trainer not found" with "Browse Trainers" action |
| **Error** | `EmptyState` with retry |
| **No courses** | "This trainer hasn't published any courses yet." |
| **No reviews** | "No reviews yet. Be the first to review!" |

### 4.4 Course Detail — `/course/[slug]`

#### Layout

```
+------------------------------------------+-----------+
|  Breadcrumb: Home > Trainers > [Name]     |           |
|                                          |           |
|  Course Title (h1)              [PHYS]   |  KES 5,000|
|  Category tag                           |           |
|                                          |  [Enrol   |
|  [TrainerAvatar] Trainer Name [✓]        |   Now]    |
|  [Link to trainer profile]               |           |
|                                          |  🛡 Money |
|  ───────────────────────                |  held     |
|  About this course...                    |  safely   |
|                                          |           |
|  What you'll learn:                      |           |
|  ✓ Outcome 1                            |           |
|  ✓ Outcome 2                            |           |
|                                          |           |
|  Prerequisites: None                     |           |
|                                          |           |
|  Milestone Payment Breakdown:            |           |
|  ┌────────┬──────────┬──────────┐        |           |
|  │  25%   │   50%    │   25%    │        |           |
|  │ Start  │ Mid-way  │Complete  │        |           |
|  │KES1,250│ KES2,500 │KES1,250  │        |           |
|  └────────┴──────────┴──────────┘        |           |
+------------------------------------------+-----------+
```

- **Sidebar:** Desktop: sticky `top-24`. Mobile: fixed bottom CTA bar "From KES 5,000 — [Enrol Now]" → opens bottom Sheet with sidebar content.

#### Milestone Payment Visual

Three connected segments in a horizontal progress bar. Each segment:
- Filled orange = released
- Outlined = pending
- Amount shown below

#### States

| State | Behaviour |
|-------|-----------|
| **Loading** | Full page skeleton |
| **Not found** | `EmptyState` with "Browse Courses" |
| **Course unpublished** | If not published and not owner → 404. If owner → "This course is in draft mode" banner. |
| **Enrolment flow** | See Section 6.1 — M-Pesa Payment Modal |

---

## 5. Dashboard Specifications

### 5.1 Shared Dashboard Shell

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useAuth() // redirects to /auth/login if not authenticated
  const role = session.user.role

  // Role-based redirect: /dashboard redirects to /dashboard/trainee or /dashboard/trainer or /dashboard/admin
  return (
    <div className="flex h-screen">
      <DashboardSidebar role={role} />   // Desktop: w-64 fixed
      <MobileBottomNav role={role} />    // Mobile: h-16 fixed bottom
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
        {children}
      </main>
    </div>
  )
}
```

#### Sidebar Navigation Items

```
Trainee:
  Overview           /dashboard/trainee          icon: LayoutDashboard
  My Enrolments      /dashboard/trainee/enrolments icon: BookOpen
  Payments           /dashboard/trainee/payments  icon: Receipt
  Reviews            /dashboard/trainee/reviews   icon: Star

Trainer:
  Overview           /dashboard/trainer          icon: LayoutDashboard
  My Courses         /dashboard/trainer/courses  icon: Book
  Enrolments         /dashboard/trainer/enrolments icon: Users
  Earnings           /dashboard/trainer/earnings icon: Wallet
  Verification       /dashboard/trainer/verification icon: ShieldCheck

Admin:
  Overview           /dashboard/admin            icon: LayoutDashboard
  Verifications      /dashboard/admin/verifications icon: ShieldCheck
  Disputes           /dashboard/admin/disputes   icon: AlertTriangle
  Transactions       /dashboard/admin/transactions icon: List
  Users              /dashboard/admin/users      icon: Users
```

- **Active state:** `bg-primary/10 text-primary border-r-2 border-primary`
- **Mobile:** Bottom tab bar, same icons, primary colour on active tab.

### 5.2 Trainee Dashboard

#### Overview Page

```
+------------------------------------------------------+
|  Hello, Jakue!                                        |
|                                                        |
|  ┌──────────┐  ┌──────────┐  ┌──────────┐            |
|  │Active: 3 │  │Completed:│  │Spent:    │            |
|  │          │  │    5     │  │KES 12,500│            |
|  └──────────┘  └──────────┘  └──────────┘            |
|                                                        |
|  Active Enrolments                                      |
|  ┌──────────────────────────────────────────────────┐ |
|  │ [Avatar] Trainer Name                             │ |
|  │ Course Title                        Next: Mon 5pm │ |
|  │ ████████████░░░░░░░░ 50%            [Continue]    │ |
|  └──────────────────────────────────────────────────┘ |
|                                                        |
|  Upcoming Sessions                                     |
|  ┌──────────────────────────────────────────────────┐ |
|  │ Mon 5 Jul 2026, 3:00 PM — Baking 101 with Jane   │ |
|  │ Tue 6 Jul 2026, 5:00 PM — Cake Decor with Jane   │ |
|  └──────────────────────────────────────────────────┘ |
|                                                        |
|  Pending Reviews                                       |
|  ⚠ You have 2 courses waiting for review              |
|  [Write a Review]                                      |
+------------------------------------------------------+
```

#### Enrolment Detail Page

```
+------------------------------------------------------+
|  [Active] Badge    Course Title                        |
|  Trainer: [Avatar] Name [✓]                           |
|  Mode: Physical | Started: 1 Jul 2026                 |
|                                                        |
|  Milestone Tracker                                     |
|                                                        |
|  ①  Start — 25% (KES 1,250)                           |
|     ✓ Funds released                                   |
|  ──────────────────────                                |
|  ②  Progress — 50% (KES 2,500)                        |
|     ● Waiting for trainer confirmation                 |
|     ⏳ Trainers marks as delivered                     |
|  ──────────────────────                                |
|  ③  Completion — 25% (KES 1,250)                      |
|     ○ Pending previous milestones                      |
|                                                        |
|  [I Attended This Session]  (shown when actionable)    |
|                                                        |
|  ──── Session History ────                             |
|  📅 1 Jul 2026, 3PM — Session 1: Introduction          |
|     ✓ Confirmed                                        |
|                                                        |
|  ──── Payment Summary ────                             |
|  Total paid: KES 5,000                                 |
|  Milestone 1: KES 1,250 — Released                     |
|  Milestone 2: KES 2,500 — Pending                     |
|  Milestone 3: KES 1,250 — Pending                     |
|                                                        |
|  [Report an Issue]                                     |
+------------------------------------------------------+
```

#### MilestoneStepper Component

```tsx
interface MilestoneStepperProps {
  milestones: Array<{
    id: string;
    sequence: number;      // 1, 2, 3
    label: string;
    percentage: number;
    amountKes: number;
    status: 'PENDING' | 'TRAINER_CONFIRMED' | 'TRAINEE_CONFIRMED' | 'RELEASED' | 'DISPUTED';
    trainerConfirmedAt?: string;
    traineeConfirmedAt?: string;
  }>;
  enrolmentStatus: string;
  role: 'TRAINEE' | 'TRAINER';
  onConfirm: (milestoneId: string) => void;
}
```

**Visual states per step:**
- `PENDING`: Grey circle, grey text, no action
- `TRAINER_CONFIRMED`: Orange outline circle, "Awaiting your confirmation" text, action button visible for trainee
- `TRAINEE_CONFIRMED`: Solid orange circle with clock icon, "Release pending (24h cool-off)" with countdown
- `RELEASED`: Solid orange circle with checkmark, green "Released" text
- `DISPUTED`: Red circle with alert icon, "Under dispute"

**Action buttons:**
- Trainee on `TRAINER_CONFIRMED`: Primary "I Attended This Session" → calls `POST /enrolments/:id/milestones/:mid/trainee-confirm`
- Trainer on `PENDING`: Primary "Mark as Delivered" → calls `POST /enrolments/:id/milestones/:mid/trainer-confirm`

**Optimistic update:** Immediately show new status with undo toast on failure.

#### States

| State | Behaviour |
|-------|-----------|
| **Loading** | Skeleton for milestones (3 placeholder circles with lines) |
| **Error loading** | Toast error, retry button |
| **Confirm error** | Toast "Failed to confirm. Please try again." |
| **No enrolments** | `EmptyState` with "Browse Trainers" CTA |
| **Enrolment cancelled** | Red status badge, all milestones greyed |

### 5.3 Trainer Dashboard

#### Overview Page

```
+------------------------------------------------------+
|  Dashboard Overview                                   |
|                                                        |
|  ┌──────────┐  ┌────────────┐  ┌──────────────────┐  |
|  │Students: │  │Total Earned│  │Available Balance  │  |
|  │    12    │  │ KES 45,000 │  │  KES 12,500       │  |
|  └──────────┘  └────────────┘  │      ★ 4.8         │  |
|                                 └──────────────────┘  |
|                                         [Withdraw]    |
|                                                        |
|  Earnings (Last 30 days)                               |
|  [Line chart — recharts LineChart]                     |
|                                                        |
|  Recent Enrolments                                     |
|  [Last 5 — compact table]                              |
|                                                        |
|  Quick Actions                                         |
|  [Create New Course]  [Withdraw]                       |
+------------------------------------------------------+
```

#### Course Management

```
+------------------------------------------------------+
|  My Courses                           [+ New Course]  |
|                                                        |
|  ┌──────┬──────────────┬──────┬──────┬────────┐       |
|  │Photo │ Title         │Price │Mode  │Live?   │       |
|  ├──────┼──────────────┼──────┼──────┼────────┤       |
|  │[img] │ Baking 101    │5,000 │PHYS  │✓ On    │       |
|  │      │ 3 enrolments  │      │      │        │       |
|  ├──────┼──────────────┼──────┼──────┼────────┤       |
|  │[img] │ Cake Decor    │3,000 │VIRT  │○ Draft │       |
|  │      │ 0 enrolments  │      │      │        │       |
|  └──────┴──────────────┴──────┴──────┴────────┘       |
|                                                        |
|  (Click row → edit course page)                        |
+------------------------------------------------------+
```

- **Toggle switch:** shadcn `Switch`. On toggle publish state → API call with optimistic update. Toast on error.
- **Empty:** `EmptyState` "No courses yet. Create your first course!" with `[+ New Course]` button.

#### Create/Edit Course Page

```
+------------------------------------------------------+
|  [Back to My Courses]                                 |
|                                                        |
|  Create New Course                                     |
|                                                        |
|  Title: [_____________________________]               |
|  Description: [_______________________________]       |
|               [_______________________________]       |
|                                                        |
|  Category: [Select ▼]                                  |
|  Mode: [Physical] [Virtual] [Hybrid]                   |
|  Session Count: [8]   Duration: [4 weeks]             |
|  Price (KES): [5000]                                   |
|  Location: [________________] (if physical)            |
|                                                        |
|  Learning Outcomes:                                    |
|  [✓] Outcome 1                            [Add +]    |
|  [×] By the end, you'll know how to...                 |
|                                                        |
|  Prerequisites: [________________]                     |
|                                                        |
|  Image: [Drop image here or click to upload]           |
|         (Preview thumbnail, max 5MB)                   |
|                                                        |
|  [Save as Draft]      [Publish]                        |
+------------------------------------------------------+
```

**Form validation:** Client-side Zod via `react-hook-form` + `@hookform/resolvers`.  
**Image upload:** Drag & drop zone using `react-dropzone` → presigned URL to R2 via `/api/upload`.

#### Earnings Page

```
+------------------------------------------------------+
|  Earnings & Payouts                                   |
|                                                        |
|  Available Balance                           KES 12,500|
|  Pending Release                               KES 3,750|
|  Total Earned                                 KES 45,000|
|                                                        |
|  [Withdraw Funds]                                      |
|                                                        |
|  Transaction History                                   |
|  ┌────────────┬──────────────────────┬────────┬──────┐ |
|  │Date        │ Description          │ Amount │ Bal  │ |
|  ├────────────┼──────────────────────┼────────┼──────┤ |
|  │1 Jul 2026  │ Milestone 1: Baking  │+2,500  │12,500│ |
|  │28 Jun 2026 │ Withdrawal           │-5,000  │10,000│ |
|  └────────────┴──────────────────────┴────────┴──────┘ |
|                                                        |
|  [View All] (paginated)                                |
+------------------------------------------------------+
```

#### Withdrawal Modal

```tsx
interface WithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;  // availableBalance
}
```

**Steps:**

```
Step 1:
  Amount: [________] KES (max: KES 12,500)
  M-Pesa Phone: [+254 712 345 678] (editable)
  [Send Verification Code]

Step 2 (after code sent):
  Enter 6-digit code: [____] (otp input, 6 boxes)
  [Confirm Withdrawal]

Step 3 (processing):
  ⏳ Processing your withdrawal...

Step 4 (success):
  ✓ Withdrawal initiated! KES 5,000 will be sent to
    +254 712 345 678 within 24 hours.
  [Done]

Step 4 (error):
  ✕ Withdrawal failed: [reason]
  [Try Again]  [Contact Support]
```

#### Verification Page

```
+------------------------------------------------------+
|  Get Verified                                         |
|                                                        |
|  [Shield icon large]                                   |
|                                                        |
|  Benefits of verification:                             |
|  • Build trust with potential students                |
|  • Higher visibility in search                        |
|  • Verification badge on your profile                 |
|                                                        |
|  Step 1: Upload ID                                    |
|  [Drop your National ID or Passport here]              |
|  (Accepted: PDF, JPG, PNG. Max 10MB)                  |
|  [file-uploaded.pdf ✓]                                |
|                                                        |
|  Step 2: Record Introduction Video                    |
|  [🎥 Record Video] or [Upload Video File]             |
|  Tell students: who you are, what you teach,          |
|  your experience. Keep it under 2 minutes.            |
|  [video-preview.mp4 ✓]                                |
|                                                        |
|  Step 3: Pay Verification Fee                         |
|  Fee: KES 5,000 (one-time payment)                    |
|  [Pay KES 5,000 via M-Pesa]                           |
|                                                        |
|  Status: [Pending Admin Review]                        |
|  We'll review your documents within 2 business days.  |
+------------------------------------------------------+
```

**States:**

| State | Display |
|-------|---------|
| **UNSUBMITTED** | Full form as above |
| **PENDING** | Read-only summary + "Pending admin review" banner (yellow) |
| **APPROVED** | Badge active + green banner "You're verified!" |
| **REJECTED** | Reason shown, re-upload button |
| **First 100** | Banner: "You're a Founding Trainer! Verification fee waived and 0% commission for life." All steps auto-completed. |

### 5.4 Admin Dashboard

#### Verifications Queue

```
+------------------------------------------------------+
|  Verification Requests              [Pending ▼]       |
|                                                        |
|  ┌──────┬──────────┬────────────┬──────┬────────┐    |
|  │Name  │ Documents│ Submitted  │View  │ Actions │    |
|  ├──────┼──────────┼────────────┼──────┼────────┤    |
|  │Jane  │ [ID] [V] │ 2 hours ago│      │[✓][✕]  │    |
|  │Doe   │          │            │      │        │    |
|  └──────┴──────────┴────────────┴──────┴────────┘    |
|                                                        |
|  Click [ID] → Modal with document preview              |
|  Click [V] → Modal with video player                   |
|  [✓] Approve → Confirm dialog → success toast         |
|  [✕] Reject → Dialog with reason textarea             |
+------------------------------------------------------+
```

#### Dispute Detail

```
+------------------------------------------------------+
|  Dispute #123    Status: [Open]                       |
|                                                        |
|  Enrolment: Baking 101 — Jane Doe & John Smith        |
|  Raised by: Jane Doe (Trainee)                        |
|  Reason: "Trainer didn't show up for session 2"       |
|                                                        |
|  Milestone 2: KES 2,500 — TRAINER_CONFIRMED           |
|  Session Log: No check-in from either party           |
|                                                        |
|  Resolution:                                          |
|  [Release to Trainer] [Refund to Trainee] [Split 50/50]|
|                                                        |
|  Admin Notes:                                          |
|  [_______________________________________________]    |
|                                                        |
|  [Resolve Dispute]                                     |
+------------------------------------------------------+
```

#### Transaction Ledger

```
+------------------------------------------------------+
|  Transaction Ledger                                    |
|  [Filter: Type ▼] [From: 📅] [To: 📅] [Search...]    |
|                                                        |
|  ┌────────┬────────┬────────┬──────┬──────────┬───┐  |
|  │Date    │ Type   │ User   │Amt   │ Reference │M-P│  |
|  ├────────┼────────┼────────┼──────┼──────────┼───┤  |
|  │1 Jul   │TRAINEE │ John   │+5,000│Enrol: 123│ABC│  |
|  │        │PAYMENT │ Smith  │      │          │   │  |
|  └────────┴────────┴────────┴──────┴──────────┴───┘  |
|                                                        |
|  Read-only — no actions                                |
+------------------------------------------------------+
```

---

## 6. Key Interaction Flows

### 6.1 M-Pesa Payment Modal

**File:** `components/payment/mpesa-payment-modal.tsx`

```tsx
interface MpesaPaymentModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  amountKes: number;
  onSuccess: (enrolmentId: string) => void;
}
```

**States:**

```
1. CONFIRM:
   [Modal] Course: Baking 101 — KES 5,000
           Phone: +254 712 345 678 (pre-filled, editable)
           [Proceed to Payment]

2. PUSHING:
   [Modal] Contacting M-Pesa... (spinner)
           (calls POST /api/v1/enrolments)

3. STK_PUSH_SENT:
   [Modal] ✓ M-Pesa request sent!
           Check your phone and enter your PIN.
           🔄 Waiting for confirmation... 0:30 elapsed
           (polls GET /enrolments/:id every 3s, 60s timeout)

4a. SUCCESS:
    [Modal] ✓ Payment successful! You're enrolled in
             Baking 101.
            [Go to My Enrolments]

4b. FAILURE:
    [Modal] ✕ Payment failed: [reason from API]
            [Try Again] [Cancel]

4c. TIMEOUT:
    [Modal] ⏱ Payment confirmation timed out.
            Your enrolment is pending. Check your
            M-Pesa and try again.
            [Check Status] [Cancel]
```

**Timing:** Poll for up to 60 seconds. After that, show timeout state. User can still navigate to enrolments to check status later.

**Error handling:**
- Network error: "Could not reach server. Check your connection." + Retry
- STK Push rejected by user: Show failure message
- Insufficient M-Pesa balance: Display "Transaction failed — insufficient funds"

### 6.2 Dispute Flow

```
Trainee clicks "Report an Issue" on enrolment detail
  → Opens DisputeForm dialog
  → Select milestone (optional), enter reason (min 10 chars)
  → Submit → POST /api/v1/enrolments/:id/disputes
  → Toast "Dispute raised. Admin will review within 48 hours."
  → Related milestone shows DISPUTED status in stepper
```

### 6.3 2FA Withdrawal Flow

```
Trainer clicks [Withdraw] on Earnings page
  → WithdrawalModal opens (Step 1)
  → Enter amount + phone → [Send Verification Code]
  → POST /api/v1/payouts/request-2fa
  → Email sent with 6-digit code
  → Step 2: Enter code → [Confirm Withdrawal]
  → POST /api/v1/payouts/request { amount, phone, code }
  → Show "Processing" then success/failure
```

**States:**
- **Code sent:** "A verification code has been sent to your email" with resend link (60s cooldown)
- **Invalid code:** "Invalid code. Please try again." (max 3 attempts → lockout 15min)
- **Insufficient balance:** "Amount exceeds your available balance"
- **Success:** Green check + "Withdrawal initiated"
- **Error:** Red error + reason

---

## 7. Shared Components

### 7.1 EmptyState

```tsx
interface EmptyStateProps {
  icon: LucideIcon;       // default: Inbox
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}
```

```tsx
// Usage
<EmptyState
  icon={Search}
  title="No trainers found"
  subtitle="Try adjusting your search filters"
  action={{ label: "Clear Filters", onClick: clearFilters }}
/>
```

### 7.2 LoadingSkeleton

```tsx
// Generic card skeleton — used across listings
<div className="rounded-card bg-white shadow-card p-4 animate-pulse">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 h-12 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
  <div className="space-y-2">
    <div className="h-3 bg-gray-200 rounded w-full" />
    <div className="h-3 bg-gray-200 rounded w-2/3" />
  </div>
</div>
```

### 7.3 ErrorBoundary

Wrap each dashboard section in `ErrorBoundary` that catches rendering errors and shows:

```tsx
<EmptyState
  icon={AlertTriangle}
  title="Something went wrong"
  subtitle="An unexpected error occurred"
  action={{ label: "Try Again", onClick: () => window.location.reload() }}
/>
```

### 7.4 Toast System

| Event | Toast |
|-------|-------|
| Successful enrolment | `toast.success("Enrolled successfully! Check your M-Pesa.")` |
| Milestone confirmed | `toast.success("Session confirmed. Release pending (24h).")` |
| Withdrawal initiated | `toast.success("Withdrawal initiated. Funds sent within 24h.")` |
| API error | `toast.error(error.response.data.error.message)` |
| Network error | `toast.error("Connection error. Please check your internet.")` |
| Rate limited | `toast.error("Too many requests. Please wait a moment.")` |

---

## 8. Client-Side Data Fetching Strategy

### 8.1 TanStack Query Configuration

```typescript
// lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s before refetch
      gcTime: 5 * 60_000,       // 5min in cache
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
```

### 8.2 API Client

```typescript
// lib/api.ts
const api = {
  get: async <T>(url: string) => {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new ApiError(await res.json())
    return res.json() as T
  },
  post: async <T>(url: string, body?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })
    if (!res.ok) throw new ApiError(await res.json())
    return res.json() as T
  },
  // patch, delete similarly
}
```

### 8.3 Query Key Convention

```typescript
export const queryKeys = {
  trainers: {
    all:    ['trainers'] as const,
    list:   (filters: TrainerFilters) => ['trainers', 'list', filters] as const,
    detail: (slug: string) => ['trainers', slug] as const,
    courses: (id: string) => ['trainers', id, 'courses'] as const,
    reviews: (id: string, page: number) => ['trainers', id, 'reviews', page] as const,
  },
  courses: {
    all:    ['courses'] as const,
    list:   (filters: CourseFilters) => ['courses', 'list', filters] as const,
    detail: (slug: string) => ['courses', slug] as const,
  },
  enrolments: {
    all:     ['enrolments'] as const,
    list:    (filters?: EnrolmentFilters) => ['enrolments', 'list', filters] as const,
    detail:  (id: string) => ['enrolments', id] as const,
  },
  dashboard: {
    traineeStats:  ['dashboard', 'trainee', 'stats'] as const,
    trainerStats:  ['dashboard', 'trainer', 'stats'] as const,
    adminStats:    ['dashboard', 'admin', 'stats'] as const,
  },
  earnings: {
    summary:  ['earnings', 'summary'] as const,
    history:  (page: number) => ['earnings', 'history', page] as const,
  },
  payouts: {
    list: (page: number) => ['payouts', page] as const,
  },
}
```

### 8.4 Mutation Patterns

```typescript
// Example: confirm milestone
const mutation = useMutation({
  mutationFn: (milestoneId: string) =>
    api.post(`/enrolments/${enrolmentId}/milestones/${milestoneId}/trainee-confirm`),
  onMutate: async (milestoneId) => {
    // Optimistic update — immediately update cache
    await queryClient.cancelQueries({ queryKey: queryKeys.enrolments.detail(enrolmentId) })
    const previous = queryClient.getQueryData(queryKeys.enrolments.detail(enrolmentId))
    queryClient.setQueryData(queryKeys.enrolments.detail(enrolmentId), (old: any) => ({
      ...old,
      milestones: old.milestones.map((m: any) =>
        m.id === milestoneId ? { ...m, status: 'TRAINEE_CONFIRMED' } : m
      ),
    }))
    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on failure
    queryClient.setQueryData(queryKeys.enrolments.detail(enrolmentId), context?.previous)
    toast.error('Failed to confirm. Please try again.')
  },
  onSuccess: () => {
    toast.success('Session confirmed! Release pending (24h).')
  },
})
```

---

## 9. Authentication Flow (Frontend)

### 9.1 AuthProvider

```tsx
// components/auth/auth-provider.tsx
const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null)
```

**Behaviour:**
1. On mount, call `GET /api/v1/auth/me` (access token in cookie)
2. If 401 → attempt silent refresh via `POST /api/v1/auth/refresh`
3. If refresh fails → user is null (unauthenticated)
4. `login()` and `register()` set cookies on response. Update state.
5. `logout()` → call `POST /api/v1/auth/logout` → clear state → redirect to `/`

### 9.2 Auth Guards

```tsx
// components/auth/protected-route.tsx
// Wraps dashboard layouts — redirects to /auth/login if not authenticated

// components/auth/role-guard.tsx
// Wraps admin pages — shows 403 if wrong role
```

### 9.3 Login Page Flow

```
  [Vuka Logo]
  Welcome back
  Email: [________________]
  Password: [________________]
  [Login]
  Don't have an account? [Register]

Error states:
  - "Invalid email or password" (generic, no user enumeration)
  - "Account suspended. Contact support."
  - "Too many attempts. Try again in 15 minutes."
```

---

## 10. Performance & UX Notes

| Requirement | Implementation |
|------------|---------------|
| SSR for public pages | `force-dynamic` or `revalidate = 60` for listing pages |
| Image optimization | `next/image` with Cloudflare R2 as remote pattern |
| Route prefetch | `<Link prefetch={true}>` for dashboard nav links |
| Skeleton loading | Always show skeletons, never spinners for page loads |
| Infinite loading | Not in MVP — use pagination |
| Debounced search | 300ms debounce on trainer search input |
| Optimistic updates | Milestone confirmations, course publish toggles |
| Error boundaries | One per dashboard section |
| Offline detection | `navigator.onLine` listener → offline toast + fallback message |
| Lazy loading modals | `next/dynamic` for M-Pesa modal, Withdrawal modal |

---

## 11. PWA Configuration

```json
// public/manifest.json
{
  "name": "Vuka — Skill Marketplace",
  "short_name": "Vuka",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#E8611A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- **Install prompt:** Listen for `beforeinstallprompt` event, show banner at bottom of screen on first visit.
- **Offline page:** Service worker caches `app shell` (navbar, footer, skeleton). Dynamic content shows custom "You're offline" component.
- **Splash screen:** Generated from theme_color + icon.

---

## 12. Accessibility Checklist

- All interactive elements keyboard-navigable
- Focus ring: `focus-visible:ring-2 focus-visible:ring-primary`
- Alt text on all images (empty `alt=""` for decorative)
- ARIA labels on icon buttons
- Colour contrast: orange on white passes AA at 16px+ (4.5:1)
- Form errors: `aria-invalid` + `aria-describedby` linked to error message
- Skip to content link
- Reduced motion: `prefers-reduced-motion` disables animations

---

## 13. File Structure

```
/app
  /(public)
    layout.tsx                  // PublicLayout (navbar + footer)
    page.tsx                    // Homepage
    /trainers/page.tsx          // Trainer listing
    /trainer/[slug]/page.tsx    // Trainer profile
    /course/[slug]/page.tsx     // Course detail
    /auth/login/page.tsx        // Login
    /auth/register/page.tsx     // Register
    /trust/page.tsx             // Trust page
  /(dashboard)
    layout.tsx                  // DashboardLayout (sidebar + bottom nav)
    /trainee/page.tsx           // Trainee overview
    /trainee/enrolments/page.tsx
    /trainee/enrolments/[id]/page.tsx
    /trainer/page.tsx           // Trainer overview
    /trainer/courses/page.tsx
    /trainer/courses/new/page.tsx
    /trainer/courses/[id]/page.tsx
    /trainer/enrolments/page.tsx
    /trainer/enrolments/[id]/page.tsx
    /trainer/earnings/page.tsx
    /trainer/verification/page.tsx
    /admin/page.tsx
    /admin/verifications/page.tsx
    /admin/disputes/page.tsx
    /admin/disputes/[id]/page.tsx
    /admin/transactions/page.tsx
    /admin/users/page.tsx

/components
  /ui                          // shadcn/ui primitives
    button.tsx, input.tsx, card.tsx, badge.tsx, avatar.tsx,
    dialog.tsx, sheet.tsx, select.tsx, switch.tsx, slider.tsx,
    skeleton.tsx, toast.tsx, tooltip.tsx, progress.tsx, tabs.tsx
  /layout
    top-navigation.tsx
    footer.tsx
    dashboard-sidebar.tsx
    mobile-bottom-nav.tsx
    user-avatar-dropdown.tsx
  /public
    hero-section.tsx
    how-it-works.tsx
    popular-categories.tsx
    featured-trainers.tsx
    trust-banner.tsx
    trainer-card.tsx
    course-card.tsx
    review-card.tsx
    verified-badge.tsx
  /dashboard
    stats-card.tsx
    enrolment-card.tsx
    milestone-stepper.tsx
    session-calendar.tsx
    earnings-chart.tsx
    transaction-table.tsx
    withdrawal-modal.tsx
    verification-form.tsx
  /payment
    mpesa-payment-modal.tsx
  /shared
    empty-state.tsx
    loading-skeleton.tsx
    error-boundary.tsx
    pagination.tsx
    filter-bar.tsx
    confirm-dialog.tsx
  /auth
    auth-provider.tsx
    protected-route.tsx
    role-guard.tsx

/lib
  api.ts                       // API client
  query-client.ts              // TanStack Query config
  query-keys.ts                // Query key factory
  utils.ts                     // cn(), formatCurrency(), formatDate()
  validators.ts                // Zod schemas shared with API
  hooks
    use-auth.ts
    use-debounce.ts
    use-media-query.ts
    use-pagination.ts

/types
  api.ts                       // API response types
  models.ts                    // Prisma model mirrors
  dashboard.ts                 // Dashboard-specific types

/public
  manifest.json
  sw.js
  icons/
    icon-192.png
    icon-512.png
  images/
    hero-illustration.svg
    logo.svg
    logo-mark.svg
```

---

*This specification covers every screen, component, state, and interaction for the Vuka frontend. Implementation should begin with the design system tokens + shadcn/ui setup, then public pages (SSR), then dashboards, then payment interactions.*
