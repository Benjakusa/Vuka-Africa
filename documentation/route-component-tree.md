# Vuka — Route & Component Tree Map

```
Root Layout (app/layout.tsx)
├── QueryProvider
├── ToastProvider
├── AuthProvider
│
├── PublicLayout (app/(public)/layout.tsx)
│   ├── TopNavigation
│   │   ├── Logo
│   │   ├── NavLinks (Trainers, How it Works, Trust)
│   │   ├── AuthButtons (Login / Register / AvatarDropdown)
│   │   └── MobileMenu (Sheet)
│   ├── [page content]
│   └── Footer
│
│   ├── Homepage (app/(public)/page.tsx)
│   │   ├── HeroSection
│   │   ├── HowItWorks (4 step cards)
│   │   ├── PopularCategories (6 grid cards)
│   │   ├── FeaturedTrainers (horizontal scroll + SkeletonCard)
│   │   ├── TrustBanner
│   │   └── FinalCTA
│   │
│   ├── /trainers (app/(public)/trainers/page.tsx)
│   │   ├── FilterBar
│   │   │   ├── SearchInput (debounced 300ms)
│   │   │   ├── CategorySelect
│   │   │   ├── ModeSelect
│   │   │   ├── PriceSlider
│   │   │   ├── VerifiedOnlyToggle
│   │   │   ├── SortSelect
│   │   │   └── ActiveFilterChips
│   │   ├── TrainerGrid
│   │   │   ├── TrainerCard (or SkeletonCard ×6)
│   │   │   ├── EmptyState
│   │   │   └── ErrorState
│   │   └── Pagination
│   │
│   ├── /trainer/[slug] (app/(public)/trainer/[slug]/page.tsx)
│   │   ├── ProfileHeader
│   │   │   ├── CoverImage
│   │   │   ├── Avatar (96px)
│   │   │   ├── TrainerName + VerifiedBadge
│   │   │   ├── StatsRow (students, courses, reviews)
│   │   │   └── ShareButton
│   │   ├── BioSection
│   │   ├── SkillsTags (Badge list)
│   │   ├── CoursesSection
│   │   │   ├── CourseCard (or SkeletonCard ×3)
│   │   │   └── EmptyState
│   │   └── ReviewsSection
│   │       ├── AverageRating + BreakdownBar
│   │       ├── ReviewCard (or SkeletonCard ×3)
│   │       │   └── Avatar, Name, Stars, Date, Comment
│   │       ├── EmptyState
│   │       └── Pagination
│   │
│   ├── /course/[slug] (app/(public)/course/[slug]/page.tsx)
│   │   ├── Breadcrumb
│   │   ├── CourseHeader
│   │   │   ├── Title + ModeBadge + CategoryTag
│   │   │   └── TrainerMiniCard (avatar, name, verified, link)
│   │   ├── CourseContent
│   │   │   ├── Description
│   │   │   ├── LearningOutcomes (list with check icons)
│   │   │   ├── Prerequisites
│   │   │   └── MilestonePaymentVisual (3-step bar)
│   │   ├── Sidebar (sticky desktop) / BottomSheet (mobile)
│   │   │   ├── PriceDisplay
│   │   │   ├── EnrolButton → MPesaPaymentModal
│   │   │   └── TrustNote (shield icon + text)
│   │   └── ErrorState / NotFoundState
│   │
│   ├── /auth/login (app/(public)/auth/login/page.tsx)
│   │   ├── Logo
│   │   ├── EmailInput
│   │   ├── PasswordInput
│   │   ├── SubmitButton
│   │   ├── ErrorMessage
│   │   └── RegisterLink
│   │
│   └── /auth/register (app/(public)/auth/register/page.tsx)
│       ├── Logo
│       ├── FullNameInput
│       ├── EmailInput
│       ├── PhoneInput (+254 prefix)
│       ├── PasswordInput
│       ├── RoleSelect (Trainee/Trainer)
│       ├── SubmitButton
│       ├── ErrorMessage
│       └── LoginLink
│
├── DashboardLayout (app/(dashboard)/layout.tsx)
│   ├── DashboardSidebar (desktop)
│   │   └── NavItem × N (icon, label, active indicator)
│   ├── MobileBottomNav (mobile)
│   │   └── TabItem × 5 (icon, label, badge)
│   ├── DashboardHeader
│   │   ├── Breadcrumb
│   │   └── UserAvatarDropdown
│   │       ├── ProfileLink
│   │       ├── SettingsLink
│   │       └── LogoutButton
│   └── <main>{children}</main>
│
│   ├── Trainee Dashboard (app/(dashboard)/trainee/)
│   │   ├── Overview (page.tsx)
│   │   │   ├── Greeting
│   │   │   ├── StatsCard ×3 (Active, Completed, Spent)
│   │   │   ├── ActiveEnrolmentsSection
│   │   │   │   ├── EnrolmentCard × N
│   │   │   │   └── EmptyState
│   │   │   ├── UpcomingSessions
│   │   │   └── PendingReviewsBanner
│   │   │
│   │   └── Enrolment Detail ([id]/page.tsx)
│   │       ├── StatusBadge
│   │       ├── CourseInfo + TrainerInfo
│   │       ├── MilestoneStepper
│   │       │   └── MilestoneStep × 3
│   │       │       ├── StatusCircle (grey/orange/green/red)
│   │       │       ├── Label + Amount
│   │       │       ├── StatusText
│   │       │       └── ActionButton / DisabledState
│   │       ├── SessionHistory
│   │       ├── PaymentSummary
│   │       ├── DisputeButton → DisputeForm Dialog
│   │       ├── LoadingSkeleton
│   │       └── ErrorState
│   │
│   ├── Trainer Dashboard (app/(dashboard)/trainer/)
│   │   ├── Overview (page.tsx)
│   │   │   ├── StatsCard ×4 (Students, Earned, Balance, Rating)
│   │   │   ├── EarningsChart (recharts LineChart)
│   │   │   ├── RecentEnrolments (compact table)
│   │   │   └── QuickActions (Create Course, Withdraw)
│   │   │
│   │   ├── Courses (courses/page.tsx)
│   │   │   ├── Header + NewCourseButton
│   │   │   ├── CourseTable / CourseCard × N
│   │   │   │   ├── Image, Title, Price, Mode, EnrolmentCount
│   │   │   │   └── PublishToggle (Switch with optimistic update)
│   │   │   └── EmptyState
│   │   │
│   │   ├── Create/Edit Course ([id]/page.tsx or new/page.tsx)
│   │   │   └── CourseForm
│   │   │       ├── TitleInput
│   │   │       ├── DescriptionTextarea
│   │   │       ├── CategorySelect
│   │   │       ├── ModeRadioGroup
│   │   │       ├── DurationInput + SessionCount
│   │   │       ├── PriceInput (KES)
│   │   │       ├── LocationInput (conditional)
│   │   │       ├── LearningOutcomesList (dynamic add/remove)
│   │   │       ├── PrerequisitesInput
│   │   │       ├── ImageUpload (drag & drop → R2)
│   │   │       ├── PreviewButton
│   │   │       └── SaveDraftButton + PublishButton
│   │   │
│   │   ├── Enrolments (enrolments/page.tsx)
│   │   │   ├── EnrolmentList
│   │   │   └── EnrolmentRow (trainee info, course, progress)
│   │   │
│   │   ├── Enrolment Detail (enrolments/[id]/page.tsx)
│   │   │   ├── TraineeContactInfo
│   │   │   ├── MilestoneStepper (trainer actions: Mark Delivered)
│   │   │   ├── SessionHistory
│   │   │   └── ContactTraineeButton (mailto:)
│   │   │
│   │   ├── Earnings (earnings/page.tsx)
│   │   │   ├── BalanceSummary (Available, Pending, Total)
│   │   │   ├── WithdrawButton → WithdrawalModal
│   │   │   │   ├── Step 1: Amount + Phone
│   │   │   │   ├── Step 2: 2FA Code Input
│   │   │   │   ├── Step 3: Processing
│   │   │   │   └── Step 4: Success/Failure
│   │   │   └── TransactionTable (paginated)
│   │   │
│   │   └── Verification (verification/page.tsx)
│   │       ├── BenefistList
│   │       ├── Step 1: IDUpload (drag & drop)
│   │       ├── Step 2: VideoUpload (record or file)
│   │       ├── Step 3: PayFeeButton
│   │       └── StatusBanner (Unsubmitted/Pending/Approved/Rejected)
│   │
│   └── Admin Dashboard (app/(dashboard)/admin/)
│       ├── Overview (page.tsx)
│       │   ├── StatsCard ×6
│       │   ├── RevenueChart
│       │   └── EnrolmentTrendsChart
│       │
│       ├── Verifications (verifications/page.tsx)
│       │   ├── FilterTabs (All/Pending/Approved/Rejected)
│       │   └── VerificationRow × N
│       │       ├── TrainerName + Documents (ID modal + Video modal)
│       │       ├── SubmitDate
│       │       └── ApproveButton + RejectButton (with reason dialog)
│       │
│       ├── Disputes (disputes/page.tsx)
│       │   ├── DisputeTable (date, enrolment, raised by, status)
│       │   └── DisputeRow → DisputeDetail ([id]/page.tsx)
│       │       ├── DisputeInfo (raised by, reason, evidence)
│       │       ├── MilestoneDetails + SessionLogs
│       │       ├── ResolutionRadioGroup
│       │       ├── AdminNotesTextarea
│       │       └── ResolveButton
│       │
│       ├── Transactions (transactions/page.tsx)
│       │   ├── FilterRow (type, date range, user search)
│       │   └── LedgerTable (read-only, paginated)
│       │
│       └── Users (users/page.tsx)
│           ├── SearchInput
│           ├── UserTable (name, email, role, status, actions)
│           └── SuspendButton / ActivateButton (with confirm dialog)

└── Shared Modals & Overlays (rendered at root via portals)
    ├── MPesaPaymentModal
    └── WithdrawalModal
```

## Component Import Map

```
pages/*.tsx  →  components/public/*, components/dashboard/*
                components/shared/*, components/ui/*
                lib/api.ts, lib/query-keys.ts, hooks/*

components/public/*  →  components/shared/*, components/ui/*
components/dashboard/* → components/shared/*, components/ui/*
components/shared/* → components/ui/* (only)

lib/*  →  (no internal deps)
types/* →  (no internal deps)
```

## Key Data Dependencies Per Page

| Page                | Queries                                                                              | Mutations                                                     |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Homepage            | `GET /trainers?verifiedOnly=true&sortBy=rating&perPage=4`                            | —                                                             |
| /trainers           | `GET /trainers?{filters}`                                                            | —                                                             |
| /trainer/[slug]     | `GET /trainers/:id`, `GET /trainers/:id/courses`, `GET /trainers/:id/reviews?page=N` | —                                                             |
| /course/[slug]      | `GET /courses/:slug`                                                                 | —                                                             |
| Trainee Dashboard   | `GET /enrolments?status=ACTIVE`, `GET /dashboard/trainee/stats`                      | —                                                             |
| Enrolment Detail    | `GET /enrolments/:id`                                                                | `POST .../milestone/:id/trainee-confirm`, `POST .../disputes` |
| Trainer Overview    | `GET /dashboard/trainer/stats`, `GET /earnings/summary`                              | —                                                             |
| Trainer Courses     | `GET /trainers/me/courses`                                                           | `PATCH /courses/:id` (publish toggle)                         |
| Create/Edit Course  | — (empty form) or `GET /courses/:id` (edit)                                          | `POST /courses`, `PATCH /courses/:id`                         |
| Earnings            | `GET /earnings/summary`, `GET /payouts?page=N`                                       | `POST /payouts/request-2fa`, `POST /payouts/request`          |
| Verification        | `GET /trainers/me/verify/status`                                                     | `POST /trainers/me/verify/pay`                                |
| Admin Verifications | `GET /admin/verifications?status=PENDING`                                            | `POST .../approve`, `POST .../reject`                         |
| Admin Disputes      | `GET /admin/disputes`                                                                | `POST /admin/disputes/:id/resolve`                            |
