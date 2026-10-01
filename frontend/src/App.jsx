import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import useAdminShortcut from "./hooks/useAdminShortcut";
import AdminLayout from "./layouts/AdminLayout";
import ComplaintPortal from "./pages/ComplaintPortal";
import AdminLogin from "./pages/AdminLogin";
const Dashboard = lazy(() => import("./pages/Dashboard"));
import Tickets from "./pages/Tickets";
import TicketDetails from "./pages/TicketDetails";
const Analytics = lazy(() => import("./pages/Analytics"));
import Clusters from "./pages/Clusters";
import SimilarCases from "./pages/SimilarCases";

function AppRoutes() {
  useAdminShortcut();
  return (
    <Routes>
      <Route path="/" element={<ComplaintPortal />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="clusters" element={<Clusters />} />
        <Route path="similar" element={<SimilarCases />} />
      </Route>
      <Route
        path="*"
        element={
          <div className="state">
            <h1>Page not found</h1>
            <Link className="button primary" to="/">
              Back to customer care
            </Link>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="state" role="status">
            Opening workspace…
          </div>
        }
      >
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
