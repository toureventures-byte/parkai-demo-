import type React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { AppShell } from "./components/layout/AppShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AIAssistant from "./pages/AIAssistant";
import UploadData from "./pages/UploadData";
import Insights from "./pages/Insights";
import MonthlyParkers from "./pages/MonthlyParkers";
import SetNewPassword from "./pages/SetNewPassword";

/** After a password-reset link, ask for the new password before anything else. */
function RecoveryGate({ children }: { children: React.ReactNode }) {
  const { recovering } = useAuth();
  return recovering ? <SetNewPassword /> : <>{children}</>;
}

/** /app goes to the dashboards when there's data, otherwise to Upload. */
function HomeRedirect() {
  const { reports } = useData();
  return <Navigate to={reports.length ? "/app/insights" : "/app/data"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
      <RecoveryGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<HomeRedirect />} />
            <Route path="data" element={<UploadData />} />
            <Route path="insights" element={<Insights />} />
            <Route path="monthly" element={<MonthlyParkers />} />
            <Route path="assistant" element={<AIAssistant />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </RecoveryGate>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
