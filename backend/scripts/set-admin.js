require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  const email = "admin@example.com";
  const password = "admin@123";

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email }).select("_id role");
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS || 12));

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      { $set: { role: "admin", passwordHash, name: "System Admin" } }
    );
  } else {
    await User.create({
      name: "System Admin",
      email,
      passwordHash,
      role: "admin",
    });
  }

  const user = await User.findOne({ email }).select("_id email role");
  console.log("ADMIN_READY");
  console.log(`EMAIL=${user.email}`);
  console.log(`ROLE=${user.role}`);

  await mongoose.disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error("ADMIN_CREATE_FAIL");
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
