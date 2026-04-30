/**
 * ─────────────────────────────────────────────
 *  Create / Promote an Admin user via terminal
 * ─────────────────────────────────────────────
 *
 *  Usage:
 *    node scripts/create-admin.js <name> <email> <password>
 *
 *  Examples:
 *    node scripts/create-admin.js "John Doe" john@example.com Secret@123
 *    npm run create-admin -- "Jane" jane@mail.com Pass1234
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ── Helpers ──────────────────────────────────
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;

const printUsage = () => {
  console.log("");
  console.log(bold("  Usage:"));
  console.log(cyan('    node scripts/create-admin.js <name> <email> <password>'));
  console.log("");
  console.log(dim("  Example:"));
  console.log(dim('    node scripts/create-admin.js "System Admin" admin@site.com MyP@ss123'));
  console.log("");
};

// ── Main ─────────────────────────────────────
(async () => {
  const [, , name, email, password] = process.argv;

  // Validate arguments
  if (!name || !email || !password) {
    console.error(red("\n  ✖ Missing required arguments."));
    printUsage();
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(red(`\n  ✖ Invalid email format: "${email}"`));
    process.exit(1);
  }

  if (password.length < 6) {
    console.error(red("\n  ✖ Password must be at least 6 characters."));
    process.exit(1);
  }

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI);

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const existing = await User.findOne({ email: email.toLowerCase() }).select("_id role name");

  if (existing) {
    // User exists → promote to admin & update credentials
    await User.updateOne(
      { _id: existing._id },
      { $set: { role: "admin", passwordHash, name } }
    );
    console.log("");
    console.log(green("  ✔ Existing user promoted to admin."));
  } else {
    // Create new admin user
    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
    });
    console.log("");
    console.log(green("  ✔ New admin user created successfully."));
  }

  // Confirm
  const user = await User.findOne({ email: email.toLowerCase() }).select("_id email role name");
  console.log("");
  console.log(`  ${dim("Name:")}   ${bold(user.name)}`);
  console.log(`  ${dim("Email:")}  ${bold(user.email)}`);
  console.log(`  ${dim("Role:")}   ${bold(user.role)}`);
  console.log(`  ${dim("ID:")}     ${user._id}`);
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(red(`\n  ✖ Failed: ${error.message}`));
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
