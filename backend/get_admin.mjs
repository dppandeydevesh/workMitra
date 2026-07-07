import mongoose from "mongoose";
mongoose.connect("mongodb+srv://dppandeydevesh:OAet0duIduIiPxlp@cluster0.sqkskiq.mongodb.net/workmitra?appName=Cluster0");
const db = mongoose.connection;
db.once('open', async () => {
  const users = await db.collection('users').find({ userRole: "admin" }).toArray();
  console.log("Admins:");
  users.forEach(u => console.log(u.email));
  process.exit(0);
});
