const LevelRole = require("../database/models/levelRoles");
const logger = require("./logger");

async function assignLevelRole(guild, member, currentLevel, previousLevel) {
  try {
    const config = await LevelRole.findOne({ guildId: guild.id });

    if (!config || !config.roles.length) return;

    const sortedRoles = [...config.roles].sort((a, b) => a.level - b.level);

    const newlyEarnedRoles = sortedRoles.filter(
      (r) => r.level > previousLevel && r.level <= currentLevel,
    );

    if (!newlyEarnedRoles.length) return;

    if (config.stackRoles) {
      for (const { roleId, level } of newlyEarnedRoles) {
        const role = guild.roles.cache.get(roleId);

        if (!role) {
          logger.warn(
            `Role ${roleId} (level ${level}) not found in guild ${guild.id}`,
            { label: "LevelRoles" },
          );
          continue;
        }

        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role);
          logger.info(
            `Added stacking role "${role.name}" to ${member.user.tag} at level ${level}`,
            { label: "LevelRoles" },
          );
        }
      }
    } else {
      const allEarnedRoles = sortedRoles.filter((r) => r.level <= currentLevel);

      const roleToAdd = newlyEarnedRoles[newlyEarnedRoles.length - 1];

      for (const { roleId, level } of allEarnedRoles) {
        if (roleId === roleToAdd.roleId) continue;

        const role = guild.roles.cache.get(roleId);

        if (!role) {
          logger.warn(
            `Role ${roleId} (level ${level}) not found in guild ${guild.id} - skipping removal`,
            { label: "LevelRoles" },
          );
          continue;
        }

        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role);
          logger.info(
            `Removed old level role "${role.name}" from ${member.user.tag}`,
            { label: "LevelRoles" },
          );
        }
      }

      const newRole = guild.roles.cache.get(roleToAdd.roleId);

      if (!newRole) {
        logger.warn(
          `Target role ${roleToAdd.roleId} (level ${roleToAdd.level}) not found in guild ${guild.id}`,
          { label: "LevelRoles" },
        );
        return;
      }

      if (!member.roles.cache.has(roleToAdd.roleId)) {
        await member.roles.add(newRole);
        logger.info(
          `Assigned role "${newRole.name}" to ${member.user.tag} at level ${roleToAdd.level}`,
          { label: "LevelRoles" },
        );
      }
    }
  } catch (error) {
    logger.error(`Error assigning level role: ${error.stack}`, {
      label: "LevelRoles",
    });
  }
}

module.exports = assignLevelRole;
