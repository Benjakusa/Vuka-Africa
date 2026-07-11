import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/protected-route';

const Home = lazy(() => import('@/pages/public/Home'));
const CourseDetail = lazy(() => import('@/pages/public/CourseDetail'));
const HowItWorks = lazy(() => import('@/pages/public/HowItWorks'));
const Privacy = lazy(() => import('@/pages/public/Privacy'));
const Terms = lazy(() => import('@/pages/public/Terms'));
const TrainerProfile = lazy(() => import('@/pages/public/TrainerProfile'));
const Trainers = lazy(() => import('@/pages/public/Trainers'));
const Trust = lazy(() => import('@/pages/public/Trust'));

const AuthPage = lazy(() => import('@/pages/auth/Login'));
const RegisterRedirect = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPassword'));

const TraineeDashboard = lazy(() => import('@/pages/trainee/TraineeDashboard'));
const Enrolments = lazy(() => import('@/pages/trainee/Enrolments'));
const EnrolmentDetail = lazy(() => import('@/pages/trainee/EnrolmentDetail'));
const Payments = lazy(() => import('@/pages/trainee/Payments'));
const Reviews = lazy(() => import('@/pages/trainee/Reviews'));

const TrainerDashboard = lazy(() => import('@/pages/trainer/TrainerDashboard'));
const Courses = lazy(() => import('@/pages/trainer/Courses'));
const CourseNew = lazy(() => import('@/pages/trainer/CourseNew'));
const TrainerCourseDetail = lazy(() => import('@/pages/trainer/CourseDetail'));
const Earnings = lazy(() => import('@/pages/trainer/Earnings'));
const TrainerEnrolments = lazy(() => import('@/pages/trainer/TrainerEnrolments'));
const TrainerEnrolmentDetail = lazy(() => import('@/pages/trainer/TrainerEnrolmentDetail'));
const TrainerReviews = lazy(() => import('@/pages/trainer/TrainerReviews'));
const Verification = lazy(() => import('@/pages/trainer/Verification'));
const ProfileEdit = lazy(() => import('@/pages/trainer/ProfileEdit'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminConfig = lazy(() => import('@/pages/admin/Config'));
const AdminDisputes = lazy(() => import('@/pages/admin/Disputes'));
const AdminEarnings = lazy(() => import('@/pages/admin/Earnings'));
const AdminCourses = lazy(() => import('@/pages/admin/Courses'));
const AdminTransactions = lazy(() => import('@/pages/admin/Transactions'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminVerifications = lazy(() => import('@/pages/admin/Verifications'));

const NotFound = lazy(() => import('@/pages/NotFound'));

// Fix: stable reference so ProtectedRoute's useEffect doesn't re-run on every
// parent render (previously allowedRoles={['ADMIN']} created a new array each render).
const ADMIN_ONLY = ['ADMIN'];

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/course/:slug" element={<CourseDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/trainer/:slug" element={<TrainerProfile />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/trust" element={<Trust />} />
          </Route>

          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/register" element={<RegisterRedirect />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/trainee" element={<TraineeDashboard />} />
            <Route path="/trainee/enrolments" element={<Enrolments />} />
            <Route path="/trainee/enrolments/:id" element={<EnrolmentDetail />} />
            <Route path="/trainee/payments" element={<Payments />} />
            <Route path="/trainee/reviews" element={<Reviews />} />

            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainer/courses" element={<Courses />} />
            <Route path="/trainer/courses/new" element={<CourseNew />} />
            <Route path="/trainer/courses/:id/edit" element={<CourseNew />} />
            <Route path="/trainer/courses/:id" element={<TrainerCourseDetail />} />
            <Route path="/trainer/earnings" element={<Earnings />} />
            <Route path="/trainer/enrolments" element={<TrainerEnrolments />} />
            <Route path="/trainer/enrolments/:id" element={<TrainerEnrolmentDetail />} />
            <Route path="/trainer/reviews" element={<TrainerReviews />} />
            <Route path="/trainer/profile" element={<ProfileEdit />} />
            <Route path="/trainer/verification" element={<Verification />} />

            <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/earnings" element={<AdminEarnings />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/config" element={<AdminConfig />} />
              <Route path="/admin/disputes" element={<AdminDisputes />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/verifications" element={<AdminVerifications />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
