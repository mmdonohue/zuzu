import React from "react";
import { Routes, Route } from "react-router-dom";

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

const App: React.FC = () => {
  return (
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
      </Routes>
    </Layout>
  );
};

export default App;
