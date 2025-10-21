const mongoose = require("mongoose");
const { Status } = require("../helper/typeconfig");
const { ObjectId } = require("mongoose").Types;

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      enum: ["ADMIN", "USER"],
      uppercase: true,
      trim: true,
      required: true,
    },
    status: { type: Number, enum: Status, default: Status[0] },
    createdBy: { type: ObjectId, ref: "Users", default: null },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const roleModel = mongoose.model("Roles", roleSchema);
module.exports = roleModel;
