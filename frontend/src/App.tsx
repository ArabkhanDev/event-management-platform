import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, RequireAuth } from "./lib/auth";

import Home from "./pages/marketing/Home";
import Plans from "./pages/marketing/Plans";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminPanel from "./pages/admin/AdminPanel";
import EventsList from "./pages/dashboard/EventsList";
import EventDetail from "./pages/dashboard/EventDetail";
import EventCampaigns from "./pages/dashboard/EventCampaigns";
import OperatorBoard from "./pages/operator/OperatorBoard";
import SessionAnalytics from "./pages/analytics/SessionAnalytics";
import StageScreen from "./pages/stage/StageScreen";
import JoinEvent from "./pages/attendee/JoinEvent";
import AttendeeSession from "./pages/attendee/AttendeeSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <EventsList />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminPanel />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/events/:eventId"
              element={
                <RequireAuth>
                  <EventDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/events/:eventId/campaigns"
              element={
                <RequireAuth>
                  <EventCampaigns />
                </RequireAuth>
              }
            />
            <Route
              path="/operator/:sessionId"
              element={
                <RequireAuth>
                  <OperatorBoard />
                </RequireAuth>
              }
            />
            <Route
              path="/analytics/:sessionId"
              element={
                <RequireAuth>
                  <SessionAnalytics />
                </RequireAuth>
              }
            />

            <Route path="/stage/:sessionId" element={<StageScreen />} />
            <Route path="/join" element={<JoinEvent />} />
            <Route path="/join/:code" element={<JoinEvent />} />
            <Route path="/event/:sessionId" element={<AttendeeSession />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
