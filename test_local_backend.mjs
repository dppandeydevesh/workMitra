import { exec } from 'child_process';

const backend = exec('JWT_SECRET=testsecret MONGO_URI=mongodb://127.0.0.1:27017/workmitra ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=admin node backend/server.js');

backend.stdout.on('data', data => console.log('BACKEND:', data.trim()));
backend.stderr.on('data', data => console.error('BACKEND ERR:', data.trim()));

setTimeout(async () => {
  try {
    console.log("SENDING REQUEST...");
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Devesh Pandey",
        email: "devesh.pandey_cs23@gla.ac.in",
        collegeName: "GLA University",
        enrollmentNumber: "2315000733",
        mobile: "7080662738",
        password: "TestPassword123!",
        userRole: "student"
      })
    });
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("BODY:", text);
  } catch (e) {
    console.error("ERROR:", e);
  }
  backend.kill();
  process.exit(0);
}, 3000);
