async function run() {
  try {
    console.log("SENDING LOGIN TO LIVE...");
    const res = await fetch("https://workmitra.me/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "devesh.pandey_cs23@gla.ac.in",
        password: "TestPassword123!"
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
