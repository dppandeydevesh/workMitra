const fs = require('fs');
let content = fs.readFileSync('backend/server.js', 'utf8');

const target = `    const { projectId, studentEmail, studentName } = req.body;

    if (!projectId || !studentEmail || !studentName) {
      return res.status(400).json({ error: "Missing required application parameters." });
    }

    if (req.user.email !== studentEmail) {
      return res.status(403).json({ error: "Unauthorized application submitter identity." });
    }

    const alreadyApplied = await Application.findOne({ projectId, studentEmail });
    if (alreadyApplied) {
      return res.status(400).json({ error: "You have already applied to this project!" });
    }

    const project = await Project.findById(projectId);
    const studentUser = await User.findOne({ email: studentEmail });`;

const replacement = `    const { projectId } = req.body;
    const studentEmail = req.user.email;

    if (!projectId) {
      return res.status(400).json({ error: "Missing required application parameters." });
    }

    const alreadyApplied = await Application.findOne({ projectId, studentEmail });
    if (alreadyApplied) {
      return res.status(400).json({ error: "You have already applied to this project!" });
    }

    const project = await Project.findById(projectId);
    const studentUser = await User.findOne({ email: studentEmail });
    
    if (!studentUser) {
      return res.status(404).json({ error: "Student not found." });
    }
    const studentName = studentUser.fullName;`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');

if (normalize(content).includes(normalize(target))) {
    // Replace using regex that ignores line ending differences
    const targetRegex = new RegExp(
        normalize(target).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 
        'g'
    );
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync('backend/server.js', content);
    console.log("Replaced successfully!");
} else {
    console.log("Target not found!");
}
