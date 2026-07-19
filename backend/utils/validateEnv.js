/**
 * validateEnv.js
 * Validates all required environment variables at server startup.
 * Exits the process immediately if any critical variable is missing,
 * so failures are loud and early rather than silent at call-time.
 */

const REQUIRED_VARS = [
  { key: 'ACCESS_TOKEN_SECRET', hint: 'Secret used to sign/verify access tokens.' },
  { key: 'REFRESH_TOKEN_SECRET', hint: 'Secret used to sign/verify refresh tokens.' },
  { key: 'MONGO_URI',       hint: 'MongoDB Atlas connection string.' },
  { key: 'ADMIN_EMAIL',     hint: 'Default super-admin email for seeding.' },
  { key: 'ADMIN_PASSWORD',  hint: 'Default super-admin password for seeding.' },
  { key: 'CORS_ORIGINS',    hint: 'Comma-separated list of allowed frontend origins.' },
  { key: 'GEMINI_API_KEY',  hint: 'Google Gemini API key for all AI features.' },
  { key: 'FRONTEND_URL',    hint: 'Public frontend URL (used in password-reset emails).' },
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n🚨 FATAL: Missing required environment variables:\n');
    missing.forEach(({ key, hint }) => {
      console.error(`  ❌  ${key}\n      → ${hint}`);
    });
    console.error('\nAdd the missing variables to your .env file and restart the server.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present.');
}

module.exports = validateEnv;
