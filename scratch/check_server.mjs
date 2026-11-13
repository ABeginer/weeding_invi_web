import http from "http";

const req = http.get("http://localhost:3000", (res) => {
  console.log("Local server is running on http://localhost:3000, status:", res.statusCode);
  process.exit(0);
});

req.on("error", (e) => {
  console.log("Local server is not running on http://localhost:3000:", e.message);
  process.exit(0);
});

