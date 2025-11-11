// src/index.ts
import { createApp } from "./infrastructure/server/expressApp.js";
import { ENV } from "./config/env.js";

const app = createApp();

const PORT = ENV.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

