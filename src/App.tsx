import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { AppShell } from "./components/layout/AppShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ValetDashboard from "./pages/ValetDashboard";
import SelfParkingDashboard from "./pages/SelfParkingDashboard";
import MonthlyManager from "./pages/MonthlyManager";
import MonthlyUser from "./pages/MonthlyUser";
import AIAssistant from "./pages/AIAssistant";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UploadData from "./pages/UploadData";
import Insights from "./pages/Insights";

function App() {
  return (
    <AuthProvider>
      <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="data" element={<UploadData />} />
            <Route path="insights" element={<Insights />} />
            <Route path="valet" element={<ValetDashboard />} />
            <Route path="self-parking" element={<SelfParkingDashboard />} />
            <Route path="monthly/manager" element={<MonthlyManager />} />
            <Route path="monthly/user" element={<MonthlyUser />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
