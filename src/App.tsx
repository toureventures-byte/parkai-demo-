import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { AppShell } from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SetNewPassword from "./pages/SetNewPassword";

const Insights = lazy(() => import("./pages/Insights"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const MonthlyParkers = lazy(() => import("./pages/MonthlyParkers"));
const UploadData = lazy(() => import("./pages/UploadData"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Loading view...
    </div>
  );
}

/** After a password-reset link, ask for the new password before anything else. */
function RecoveryGate({ children }: { children: ReactNode }) {
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
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <RecoveryGate>
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/set-new-password" element={<SetNewPassword />} />

                  <Route path="/app" element={<AppShell />}>
                    <Route index element={<HomeRedirect />} />
                    <Route path="data" element={<UploadData />} />
                    <Route path="insights" element={<Insights />} />
                    <Route path="monthly" element={<MonthlyParkers />} />
                    <Route path="assistant" element={<AIAssistant />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </RecoveryGate>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
