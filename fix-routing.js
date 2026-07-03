const fs = require("fs");
let content = fs.readFileSync("src/App.jsx", "utf8");
content = content.replace(
  `} else if (user.userRole === "college") {
      return <Navigate to="/college-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }`,
  `} else if (user.userRole === "college") {
      return <Navigate to="/college-dashboard" replace />;
    } else if (user.userRole === "faculty") {
      return <Navigate to="/faculty-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }`
);
fs.writeFileSync("src/App.jsx", content);
