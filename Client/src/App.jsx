import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./components/ErrorBoundary.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import "./pages/Home.css";

// ─── Lazy-loaded pages (code-split per route) ──────────────────
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const PostJob = lazy(() => import("./pages/PostJob"));
const EditJob = lazy(() => import("./pages/EditJob"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const ManageJobs = lazy(() => import("./pages/ManageJobs"));
const Applicants = lazy(() => import("./pages/Applicants"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const SavedJobs = lazy(() => import("./pages/SavedJobs"));
const Chat = lazy(() => import("./pages/Chat"));
const Admin = lazy(() => import("./pages/Admin"));
const Analytics = lazy(() => import("./pages/Analytics"));
const JobAlerts = lazy(() => import("./pages/JobAlerts"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const CompanySetup = lazy(() => import("./pages/CompanySetup"));
const Settings = lazy(() => import("./pages/Settings"));
const SkillGap = lazy(() => import("./pages/SkillGap"));
const ResumeScore = lazy(() => import("./pages/ResumeScore"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Suspense fallback spinner ─────────────────────────────────
function PageLoader() {
  return (
    <div className="loading-container">
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/company/:id" element={<CompanyProfile />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Employer Only Routes */}
              <Route path="/post-job" element={<ProtectedRoute roles={["employer"]}><PostJob /></ProtectedRoute>} />
              <Route path="/edit-job/:id" element={<ProtectedRoute roles={["employer"]}><EditJob /></ProtectedRoute>} />
              <Route path="/manage-jobs" element={<ProtectedRoute roles={["employer"]}><ManageJobs /></ProtectedRoute>} />
              <Route path="/manage-jobs/:jobId/applicants" element={<ProtectedRoute roles={["employer"]}><Applicants /></ProtectedRoute>} />
              <Route path="/company-setup" element={<ProtectedRoute roles={["employer"]}><CompanySetup /></ProtectedRoute>} />
              
              {/* Seeker Only Routes */}
              <Route path="/my-applications" element={<ProtectedRoute roles={["seeker"]}><MyApplications /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute roles={["seeker"]}><Recommendations /></ProtectedRoute>} />
              <Route path="/saved-jobs" element={<ProtectedRoute roles={["seeker"]}><SavedJobs /></ProtectedRoute>} />
              <Route path="/skill-gap" element={<ProtectedRoute roles={["seeker"]}><SkillGap /></ProtectedRoute>} />
              <Route path="/resume-score" element={<ProtectedRoute roles={["seeker"]}><ResumeScore /></ProtectedRoute>} />
              
              {/* Admin Only Routes */}
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
              
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/job-alerts" element={<ProtectedRoute><JobAlerts /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
        </Router>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
