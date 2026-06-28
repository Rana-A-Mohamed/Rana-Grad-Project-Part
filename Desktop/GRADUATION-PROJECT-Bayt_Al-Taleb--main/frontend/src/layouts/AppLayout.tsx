import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import Home from "../pages/HomePage";
import Auth from "../pages/AuthPage";
import CollegesPage from "../pages/CollegesPage";
import CollegeDetailPage from "../pages/CollegeDetailPage";
import ScrollToTop from "../components/common/ScrollToTop";
import StudentDashboard from "../pages/StudentDashboard";
import UploadFile from "../pages/UploadFile";
import SupervisorReview from "../pages/SupervisorReview";
import AdminPanel from "../pages/AdminPanel";
import ScholarshipsPage from "../pages/ScholarshipsPage";
import MajorDetailPage from "../pages/MajorDetailPage";
import CourseSummariesPage from "../pages/CourseSummariesPage";
import SearchResultsPage from "../pages/SearchResultsPage";
const AppLayout = () => {
  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Home />} />
            <Route path="/colleges" element={<CollegesPage />} />
            <Route path="/colleges/:id" element={<CollegeDetailPage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/upload" element={<UploadFile />} />
            <Route path="/supervisor" element={<SupervisorReview />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
            <Route path="/majors/:id" element={<MajorDetailPage />} />
            <Route path="/course-summaries" element={<CourseSummariesPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default AppLayout;
