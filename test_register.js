const fetch = require('node-fetch'); // Ensure node-fetch is available if needed, or use native fetch
async function run() {
  try {
    const res = await fetch("http://localhost:10000/api/auth/register", {
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
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
