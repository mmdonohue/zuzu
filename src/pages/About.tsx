import React from 'react';
import { Box, Container, Typography, Paper, Grid, Divider } from '@mui/material';

const frontend_url = 'http://localhost:3000';
const backend_url = 'http://localhost:5000/api';  

const About: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        About ZuZu
      </Typography>
      <Typography variant="subtitle1" paragraph color="text.secondary">
        A comprehensive scaffold application for integrating multiple modern tech stacks
      </Typography>
      <Divider sx={{ my: 4 }} />
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Project Purpose
            </Typography>
            <Typography variant="body1" paragraph>
              ZuZu is designed as a scaffold application to demonstrate the integration of 
              various modern web development technologies. It provides a solid foundation
              for building complex web applications with React, TypeScript, and a suite of
              supporting libraries and tools.
            </Typography>
            <Typography variant="body1">
              This project serves as a learning platform to understand how different 
              technologies can work together seamlessly, including state management with 
              Redux, styling with Material UI and Tailwind CSS, API data fetching with 
              TanStack Query, backend services with Express, and database operations with 
              Supabase.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Architecture Overview
            </Typography>
            <Typography variant="body1" paragraph>
              The application follows a modern React architecture with TypeScript for type safety. 
              It uses Redux for global state management and TanStack Query for server state management.
            </Typography>
            <Typography variant="body1" paragraph>
              The frontend is built with React and styled using a combination of Material UI components 
              and Tailwind CSS utilities. Webpack handles the bundling of the application.
            </Typography>
            <Typography variant="body1">
              The backend is powered by Express providing API endpoints, while Supabase 
              serves as the database solution. Cypress is integrated for end-to-end testing
              of the application.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, mt: 2 }} className="border border-gray-200">
            <Typography variant="h5" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph>
              To run this project locally:
            </Typography>
            <Box component="pre" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }} className="bg-gray-800">
              {`# Install dependencies
npm install

# Run the development server (frontend + backend)
npm run dev

# Run tests
npm test`}
            </Box>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              The application will be available at <code>{frontend_url}</code> and the API endpoints 
              will be accessible at <code>{backend_url}</code>.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default About;