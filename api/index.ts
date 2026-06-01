// Vercel serverless entry point — routes all /api/* requests to the Express app
const { app } = require('../server/dist/index');

// App already mounts all routes under /api — pass directly to Vercel
module.exports = app;
