import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import CasesPage from "./routes/CasesPage";
import TemplatesPage from "./routes/TemplatesPage";
import ResearchPage from "./routes/ResearchPage";
import CalendarPage from "./routes/CalendarPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/cases" replace />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/cases" replace />} />
      </Route>
    </Routes>
  );
}
