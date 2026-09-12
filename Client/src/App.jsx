import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./components/ErrorBoundary.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import EditJob from "./pages/EditJob";
import MyApplications from "./pages/MyApplications";
import ManageJobs from "./pages/ManageJobs";
import Applicants from "./pages/Applicants";
import Recommendations from "./pages/Recommendations";
import SavedJobs from "./pages/SavedJobs";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import JobAlerts from "./pages/JobAlerts";
import CompanyProfile from "./pages/CompanyProfile";
import CompanySetup from "./pages/CompanySetup";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyEmail";
import SkillGap from "./pages/SkillGap";
import ResumeScore from "./pages/ResumeScore";
import "./pages/Home.css";

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Navbar />
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
          <Footer />
        </Router>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
