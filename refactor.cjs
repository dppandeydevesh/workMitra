const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'server.js');
let code = fs.readFileSync(filePath, 'utf8');

const blocksToRemove = [
  'const authenticateToken = (req, res, next) => {',
  'const sendSmsOtp = async (toMobile, otp) => {',
  'const smtpLogs = new Proxy([], {',
  'const sendEmailOtp = async (toEmail, otp) => {',
  'const sendResetPasswordEmail = async (toEmail, resetLink) => {',
  'const registerLimiter = rateLimit({',
  'app.post("/api/auth/register", registerLimiter, async (req, res) => {',
  'app.post("/api/auth/register-verify", async (req, res) => {',
  'const loginLimiter = rateLimit({',
  "app.post('/api/auth/login', loginLimiter, async (req, res) => {",
  'app.post("/api/auth/forgot-password", async (req, res) => {',
  'app.post("/api/auth/reset-password/:token", async (req, res) => {',
  
  'app.get("/api/projects/all", authenticateToken, async (req, res) => {',
  'app.post("/api/projects", authenticateToken, async (req, res) => {',
  'app.get("/api/projects/:projectId", authenticateToken, async (req, res) => {',
  'app.get("/api/projects/company/:email", authenticateToken, async (req, res) => {',
  'app.get("/api/projects/:projectId/applicants", authenticateToken, async (req, res) => {',
  'app.put("/api/projects/:projectId", authenticateToken, async (req, res) => {',
  'app.delete("/api/projects/:projectId", authenticateToken, async (req, res) => {',
  'app.get("/api/projects/recommended", authenticateToken, async (req, res) => {'
];

function removeBlock(content, startString) {
  let startIndex = content.indexOf(startString);
  if (startIndex === -1) {
    console.log("NOT FOUND:", startString);
    return content;
  }
  
  let commentStart = content.lastIndexOf('// =========================================================================', startIndex);
  if (commentStart !== -1 && (startIndex - commentStart) < 300) {
    let secondCommentStart = content.lastIndexOf('// =========================================================================', commentStart - 1);
    if(secondCommentStart !== -1 && (commentStart - secondCommentStart) < 150) {
        startIndex = secondCommentStart;
    } else {
        startIndex = commentStart;
    }
  }

  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  let i = content.indexOf('{', startIndex);
  if (i === -1) return content;
  
  braceCount = 1;
  i++;
  
  while (i < content.length && braceCount > 0) {
    const char = content[i];
    const prevChar = content[i - 1];
    
    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }
    i++;
  }
  
  while (i < content.length && (content[i] === ')' || content[i] === ';' || content[i] === '\n' || content[i] === '\r')) {
    i++;
  }
  
  console.log("REMOVED:", startString.substring(0, 50));
  return content.substring(0, startIndex) + content.substring(i);
}

for (const startStr of blocksToRemove) {
  code = removeBlock(code, startStr);
}

const importBlock = `
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const authenticateToken = require('./middleware/authMiddleware');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
`;

code = code.replace('const app = express();', 'const app = express();' + importBlock);

fs.writeFileSync(filePath, code);
console.log("Done");
