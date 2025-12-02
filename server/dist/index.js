import dotenv from 'dotenv';
// set env vars
dotenv.config();
import express from 'express';
import cors from 'cors';
import { default as apiRoutes } from './routes/api.js';
import { default as openRouterRoutes } from './routes/openrouter.js';
/*
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('Current directory:', __dirname);
console.log('Looking for routes in:', path.join(__dirname, 'routes', 'api.js'));
*/
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api', apiRoutes);
app.use('/api/openrouter', openRouterRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
});
// Start the server
app.listen(PORT, () => {
    console.log('/********************************* SERVER *********************************************/\n');
    console.log(`Server running on http://localhost:${PORT}\n`);
    console.log('/********************************* SERVER *********************************************/\n');
});
