const mongoose = require("mongoose");

let profile = new mongoose.Schema({
  guildId: { type: String },
  userID: { type: String },
  wallet: { type: mongoose.Types.Decimal128, default: 0 },
  bank: { type: mongoose.Types.Decimal128, default: 0 },
  padlock: {
    isActive: { type: Boolean, required: true, default: false },
    usesLeft: { type: Number, default: 0 },
  },
  inventory: [
    {
      name: { type: String, required: true },
      amount: { type: Number, default: 0 },
    },
  ],
  xp: { type: mongoose.Types.Decimal128, default: 0 },
  bankCapacity: { type: mongoose.Types.Decimal128, default: 5000 },
  lastDaily: { type: Date },
  lastWeekly: { type: Date },
  lastMonthly: { type: Date },
  dailyStreak: { type: mongoose.Types.Decimal128, default: 0 },
  lastBeg: { type: Date },
  lastRob: { type: Date },
  lastWork: { type: Date },
  passiveUpdated: { type: Date },
  hasInfiniteStorage: { type: Boolean, default: false },
});

module.exports = mongoose.model("profile", profile);
