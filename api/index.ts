// Vercel serverless entry point — routes all /api/* requests to the Express app
// Uses pre-compiled JS from server/dist to avoid TS config conflicts with @vercel/node
const { app } = require('../server/dist/index');

module.exports = app;
