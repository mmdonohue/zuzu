"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var path_1 = require("path");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
console.log('Current directory:', __dirname);
console.log('Looking for routes in:', path_1.default.join(__dirname, 'routes', 'api.js'));
var express_1 = require("express");
var cors_1 = require("cors");
var api_js_1 = require("./routes/api.js");
// Initialize Express app
var app = (0, express_1.default)();
var PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Allow your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api', api_js_1.default);
// Health check endpoint
app.get('/health', function (req, res) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use(function (req, res) {
    res.status(404).json({ message: 'Route not found' });
});
// Error handler
app.use(function (err, req, res, next) {
    console.error('Server error:', err);
    var statusCode = err.statusCode || 500;
    var message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        status: 'error',
        statusCode: statusCode,
        message: message,
    });
});
// Start the server
app.listen(PORT, function () {
    console.log('/********************************* SERVER *********************************************/');
    console.log("Server running on http://localhost:".concat(PORT));
    console.log('/********************************* SERVER *********************************************/');
});
