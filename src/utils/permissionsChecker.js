const MOD_PERMISSIONS = require("./ModPermissions");

function checkModPermissions(member, action) {
  const required = MOD_PERMISSIONS[action];

  if (!required) return true;

  return member.permissions.has(required);
}

module.exports = { checkModPermissions };
