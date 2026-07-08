/**
 * seedAdmin.js
 * Seeds the default super-admin account into the database on first boot.
 * Called once after MongoDB connects successfully.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD env vars (validated at startup by validateEnv.js).
 */

const User = require('../models/User');

async function seedAdmin() {
  try {
    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) return; // Already seeded — nothing to do

    // Use a random 10-digit mobile to avoid unique index collisions
    const randomMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const newAdmin = new User({
      fullName:             'Super Admin',
      email:                adminEmail,
      password:             adminPassword,
      userRole:             'admin',
      mobile:               randomMobile,
      hasCompletedProfile:  true,
      isVerified:           true,
    });

    await newAdmin.save();
    console.log('👑 Seeded administrator account successfully.');
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
  }
}

module.exports = seedAdmin;
