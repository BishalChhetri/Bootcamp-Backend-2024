const mongoose = require("mongoose");

const upgradeReqschema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  role: { type: String, enum: ["publisher", "admin"], default: "publisher" },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

upgradeReqschema.virtual("users", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

const upgradeReq = mongoose.model("UpgradeReq", upgradeReqschema);
module.exports = upgradeReq;
