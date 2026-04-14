import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import Contact from "./pages/Contact";
import TournamentProfile from "./pages/TournamentProfile";
import ClubDashboard from "./pages/ClubDashboard";
import ClubProfile from "./pages/ClubProfile";
import ClubDashboardProfile from "./pages/ClubDashboardProfile";
import ClubSettings from "./pages/ClubSettings";
import MyTournaments from "./pages/MyTournaments";
import CreateTournament from "./pages/CreateTournament";
import EditTournament from "./pages/EditTournament";
import AthleteDashboard from "./pages/AthleteDashboard";
import AthleteProfile from "./pages/AthleteProfile";
import AthleteSettings from "./pages/AthleteSettings";
import AthleteEditProfile from "./pages/AthleteEditProfile";
import TermsPage from "./pages/TermsPage";
import PaymentPage from "./pages/PaymentPage";
import TournamentResultsPDF from "./pages/TournamentResultsPDF";
import LeagueProfile from "./pages/LeagueProfile";
import LeaguesDashboard from "./pages/LeaguesDashboard";
import PublicAthleteProfile from "./pages/PublicAthleteProfile";
import AthleteProfileById from "./pages/AthleteProfileById";

import { ToastProvider } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route
                  path="/tournaments/:id"
                  element={<TournamentProfile />}
                />
                <Route path="/contact" element={<Contact />} />

                {/* Clube */}
                <Route path="/dashboard" element={<ClubDashboard />} />
                <Route
                  path="/dashboard/profile"
                  element={<ClubDashboardProfile />}
                />
                <Route path="/dashboard/settings" element={<ClubSettings />} />
                <Route
                  path="/dashboard/tournaments"
                  element={<MyTournaments />}
                />
                <Route
                  path="/dashboard/tournaments/create"
                  element={<CreateTournament />}
                />
                <Route
                  path="/dashboard/tournaments/:id/edit"
                  element={<EditTournament />}
                />
                <Route
                  path="/dashboard/tournaments/:id/results"
                  element={<TournamentResultsPDF />}
                />
                <Route
                  path="/dashboard/leagues"
                  element={<LeaguesDashboard />}
                />
                <Route path="/clubs/:id" element={<ClubProfile />} />

                {/* Atleta */}
                <Route
                  path="/athlete/dashboard"
                  element={<AthleteDashboard />}
                />
                <Route path="/athlete/profile" element={<AthleteProfile />} />
                <Route path="/athlete/profile/edit" element={<AthleteEditProfile />} />
                <Route path="/athlete/settings" element={<AthleteSettings />} />
                <Route path="/athlete/:id" element={<AthleteProfileById />} />

                {/* Público */}
                <Route path="/athletes/:id" element={<PublicAthleteProfile />} />
                <Route path="/leagues/:id" element={<LeagueProfile />} />
                <Route path="/termos" element={<TermsPage />} />
                <Route
                  path="/privacidade"
                  element={<Navigate to="/termos" replace />}
                />
                <Route path="/pay/:token" element={<PaymentPage />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
