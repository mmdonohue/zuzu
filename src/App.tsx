import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import OpenRouterComponent from './pages/OpenRouter';
import Logs from './pages/Logs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyCode from './pages/VerifyCode';
import Account from './pages/Account';


const App: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: 4 }}
        className="container-custom"
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home message={'welcome to zuzu'} />} />
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
      </Container>
      <Footer />
    </Box>
  );
};

export default App;
