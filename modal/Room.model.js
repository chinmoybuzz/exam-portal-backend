const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { roomTimerStatus } = require("../helper/typeconfig");
const { ObjectId } = require("mongoose").Types;

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },

    duration: { type: Number, required: true }, // seconds
    startedAt: { type: Date, required: true },
    remainingTime: { type: Number, required: true }, // optional snapshot
    status: { type: Number, enum: roomTimerStatus, default: roomTimerStatus.RUNNING },
    participants: [{ type: ObjectId, ref: "Users", default: null }],
    createdBy: { type: ObjectId, ref: "Users", default: null },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

roomSchema.plugin(mongoosePaginate);

const roomModel = mongoose.model("Rooms", roomSchema);
module.exports = roomModel;
