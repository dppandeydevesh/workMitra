async function run() {
  try {
    console.log("SENDING REQUEST TO LIVE...");
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
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("BODY:", text.substring(0, 500));
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
