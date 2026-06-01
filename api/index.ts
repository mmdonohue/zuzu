// Vercel serverless entry point — routes all /api/* requests to the Express app
// Uses pre-compiled JS from server/dist to avoid TS config conflicts with @vercel/node
const express = require('express');
const { app } = require('../server/dist/index');

// Vercel passes the full path including /api prefix — wrap in a router that strips it
const wrapper = express();
wrapper.use('/api', app);

// Also handle requests without the /api prefix (fallback)
wrapper.use(app);

module.exports = wrapper;
