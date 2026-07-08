import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/protected-route';

import Home from '@/pages/public/Home';
import CourseDetail from '@/pages/public/CourseDetail';
import HowItWorks from '@/pages/public/HowItWorks';
import Privacy from '@/pages/public/Privacy';
import Terms from '@/pages/public/Terms';
import TrainerProfile from '@/pages/public/TrainerProfile';
import Trainers from '@/pages/public/Trainers';
import Trust from '@/pages/public/Trust';

import AuthPage from '@/pages/auth/Login';
import RegisterRedirect from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPasswordPage from '@/pages/auth/ResetPassword';

import TraineeDashboard from '@/pages/trainee/TraineeDashboard';
import Enrolments from '@/pages/trainee/Enrolments';
import EnrolmentDetail from '@/pages/trainee/EnrolmentDetail';
import Payments from '@/pages/trainee/Payments';
import Reviews from '@/pages/trainee/Reviews';

import TrainerDashboard from '@/pages/trainer/TrainerDashboard';
import Courses from '@/pages/trainer/Courses';
import CourseNew from '@/pages/trainer/CourseNew';
import TrainerCourseDetail from '@/pages/trainer/CourseDetail';
import Earnings from '@/pages/trainer/Earnings';
import TrainerEnrolments from '@/pages/trainer/TrainerEnrolments';
import TrainerEnrolmentDetail from '@/pages/trainer/TrainerEnrolmentDetail';
import TrainerReviews from '@/pages/trainer/TrainerReviews';
import Verification from '@/pages/trainer/Verification';
import ProfileEdit from '@/pages/trainer/ProfileEdit';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminConfig from '@/pages/admin/Config';
import AdminDisputes from '@/pages/admin/Disputes';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminUsers from '@/pages/admin/Users';
import AdminVerifications from '@/pages/admin/Verifications';

import NotFound from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <BrowserRouter>
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

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/config" element={<AdminConfig />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/verifications" element={<AdminVerifications />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
