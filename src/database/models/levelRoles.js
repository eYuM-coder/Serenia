const mongoose = require("mongoose");

const levelRoleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  stackRoles: {
    type: Boolean,
    default: false,
  },
  roles: [
    {
      level: {
        type: Number,
        required: true,
      },
      roleId: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("LevelRole", levelRoleSchema);
