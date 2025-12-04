import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';

// Import pages
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import OpenRouterComponent from './pages/OpenRouter';
import Logs from './pages/Logs';


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
          <Route path="/" element={<Home message={'welcome to zuzu'} />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/openrouter" element={<OpenRouterComponent />} /> {/* Add the new route */}
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
};

export default App;
