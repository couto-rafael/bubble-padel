import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./Home";
import Tournaments from "./Tournaments";
import Contact from "./Contact";
import TournamentProfile from "./TournamentProfile";
import ClubDashboard from "./ClubDashboard";
import ClubProfile from "./ClubProfile";
import ClubDashboardProfile from "./ClubDashboardProfile";
import ClubSettings from "./ClubSettings";
import MyTournaments from "./MyTournaments";
import CreateTournament from "./CreateTournament";
import EditTournament from "./EditTournament";
import AthleteDashboard from "./AthleteDashboard";
import AthleteProfile from "./AthleteProfile";

// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s antes de refetch automático
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentProfile />} />
            <Route path="/contact" element={<Contact />} />

            {/* Rotas do Clube */}
            <Route path="/dashboard" element={<ClubDashboard />} />
            <Route
              path="/dashboard/profile"
              element={<ClubDashboardProfile />}
            />
            <Route path="/dashboard/settings" element={<ClubSettings />} />
            <Route path="/dashboard/tournaments" element={<MyTournaments />} />
            <Route
              path="/dashboard/tournaments/create"
              element={<CreateTournament />}
            />
            <Route
              path="/dashboard/tournaments/:id/edit"
              element={<EditTournament />}
            />
            <Route path="/clubs/:id" element={<ClubProfile />} />

            {/* Rotas do Atleta */}
            <Route path="/athlete/dashboard" element={<AthleteDashboard />} />
            <Route path="/athlete/profile" element={<AthleteProfile />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
