const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  deviceInfo: {
    type: String,
    default: "Unknown device",
  },
  ip: {
    type: String,
    default: "Unknown",
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if token is expired
refreshTokenSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Static: create a new refresh token for a user
refreshTokenSchema.statics.createToken = async function (userId, req) {
  // Generate a cryptographically secure random token
  const rawToken = crypto.randomBytes(40).toString("hex");

  // Hash it before storing (so DB leaks don't compromise tokens)
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Extract device info from user-agent
  const ua = req?.headers?.["user-agent"] || "Unknown";
  let deviceInfo = "Unknown device";
  if (/mobile/i.test(ua)) deviceInfo = "Mobile Browser";
  else if (/chrome/i.test(ua)) deviceInfo = "Chrome";
  else if (/firefox/i.test(ua)) deviceInfo = "Firefox";
  else if (/safari/i.test(ua)) deviceInfo = "Safari";
  else if (/edge/i.test(ua)) deviceInfo = "Edge";
  else if (/postman/i.test(ua)) deviceInfo = "Postman";
  else deviceInfo = "Browser";

  const ip = req?.ip || req?.connection?.remoteAddress || "Unknown";

  const doc = await this.create({
    token: hashedToken,
    userId,
    deviceInfo,
    ip,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  // Return the raw (unhashed) token — this goes to the client cookie
  // We only store the hash in DB
  return { rawToken, doc };
};

// Static: find token by raw value (hash it first to compare)
refreshTokenSchema.statics.findByRawToken = function (rawToken) {
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return this.findOne({ token: hashedToken });
};

// Static: revoke all tokens for a user (e.g., password change)
refreshTokenSchema.statics.revokeAllForUser = function (userId) {
  return this.deleteMany({ userId });
};

module.exports = mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);
