import React from "react";
import { Routes, Route } from "react-router-dom";
import useLastVisited from "./hooks/useLastVisited";

// Import components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Import pages
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import OpenRouterComponent from "./pages/OpenRouter";
import LeetMaster from "./pages/LeetMaster";
import Logs from "./pages/Logs";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyCode from "./pages/VerifyCode";
import Account from "./pages/Account";
import Portfolio from "./pages/Portfolio";
import WtaCorrections from "./pages/WtaCorrections";

// Microsites
import MoxiLabs from "./sites/moxilabs";
import MoxiLabsEvents from "./sites/moxilabs/events";
import MoxiLabsEventDetail from "./sites/moxilabs/events/EventDetail";

const App: React.FC = () => {
  useLastVisited();

  return (
    <Routes>
      {/* Full-screen routes — ZuZu tools */}
      <Route path="/portfolio" element={<Portfolio />} />

      {/* Microsites — slug-based, domain overlay added when DNS is live */}
      <Route path="/moxilabs" element={<MoxiLabs />} />
      <Route path="/moxilabs/events" element={<MoxiLabsEvents />} />
      <Route path="/moxilabs/events/:eventId" element={<MoxiLabsEventDetail />} />

      {/* Routes with Layout */}
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home message={"welcome to zuzu"} />} />
              <Route path="/about" element={<About />} />

              {/* Auth routes (redirect to dashboard if already logged in) */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Signup />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/verify" element={<VerifyCode />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/openrouter"
                element={
                  <ProtectedRoute>
                    <OpenRouterComponent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leet-master"
                element={
                  <ProtectedRoute>
                    <LeetMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute>
                    <Logs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wta"
                element={
                  <ProtectedRoute>
                    <WtaCorrections />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
};

export default App;
