async function run() {
  try {
    const res = await fetch("https://workmitra.me/api/auth/register", {
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
    console.log("BODY:", text.substring(0, 500)); // Only print first 500 chars to avoid flooding
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
