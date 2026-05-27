import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import SignInPage from "./routes/SignInPage";
import CasesPage from "./routes/CasesPage";
import CaseDetailPage from "./routes/CaseDetailPage";
import TemplatesPage from "./routes/TemplatesPage";
import TemplateDetailPage from "./routes/TemplateDetailPage";
import ResearchPage from "./routes/ResearchPage";
import CalendarPage from "./routes/CalendarPage";

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />

      {/* Everything below requires auth. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/cases" replace />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateDetailPage />} />
          <Route path="/templates/:id" element={<TemplateDetailPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="*" element={<Navigate to="/cases" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
