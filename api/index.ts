// Vercel serverless entry point — routes all /api/* requests to the Express app
// server/dist/index.js is CommonJS — use require, not ESM import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app } = require("../server/dist/index");

module.exports = app;
