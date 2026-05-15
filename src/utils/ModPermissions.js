const { PermissionsBitField } = require("discord.js");

const MOD_PERMISSIONS = {
  ban: PermissionsBitField.Flags.BanMembers,
  kick: PermissionsBitField.Flags.KickMembers,
  mute: PermissionsBitField.Flags.ModerateMembers,
  manage_channels: PermissionsBitField.Flags.ManageChannels,
  manage_roles: PermissionsBitField.Flags.ManageRoles,
  nicknames: PermissionsBitField.Flags.ManageNicknames,
};

module.exports = { MOD_PERMISSIONS };
