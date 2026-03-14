import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory (so it works whether you run from repo root or backend/)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:Password@localhost:5432/ticketing_tool',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: path.resolve(process.cwd(), 'uploads'),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  // SMTP for welcome / verification emails (optional; if not set, emails are skipped and token logged in dev)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ticketing-tool.local',
  },
  // Base URL of the frontend app (for verification link in emails). e.g. http://localhost:5173
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || process.env.APP_URL || 'http://localhost:5173',
};
