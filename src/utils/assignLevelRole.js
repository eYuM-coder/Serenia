const LevelRole = require("../database/models/levelRoles");
const logger = require("./logger");

async function assignLevelRole(guild, member, currentLevel, previousLevel) {
  try {
    const config = await LevelRole.findOne({ guildId: guild.id });

    if (!config || !config.roles.length) return;

    const sortedRoles = [...config.roles].sort((a, b) => a.level - b.level);
    const eligibleRoles = sortedRoles.filter((r) => r.level <= currentLevel);

    if (!eligibleRoles.length) return;

    if (config.stackRoles) {
      for (const { roleId, level } of eligibleRoles) {
        if (member.roles.cache.has(roleId)) continue;

        const role = guild.roles.cache.get(roleId);

        if (!role) {
          logger.warn(
            `Role ${roleId} (level ${level}) not found in guild ${guild.id}`,
            { label: "LevelRoles" },
          );
          continue;
        }

        await member.roles.add(role);
        logger.info(
          `Added stacking role "${role.name}" to ${member.user.tag} at level ${level}`,
          { label: "LevelRoles" },
        );
      }
    } else {
      const roleToAdd = eligibleRoles[eligibleRoles.length - 1];

      for (const { roleId, level } of sortedRoles) {
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

      if (member.roles.cache.has(roleToAdd.roleId)) return;

      const newRole = guild.roles.cache.get(roleToAdd.roleId);

      if (!newRole) {
        logger.warn(
          `Target role ${roleToAdd.roleId} (level ${roleToAdd.level}) not found in guild ${guild.id}`,
          { label: "LevelRoles" },
        );
        return;
      }

      await member.roles.add(newRole);
      logger.info(
        `Assigned role "${newRole.name}" to ${member.user.tag} at level ${roleToAdd.level}`,
        { label: "LevelRoles" },
      );
    }
  } catch (error) {
    logger.error(`Error assigning level role: ${error.stack}`, {
      label: "LevelRoles",
    });
  }
}

module.exports = assignLevelRole;
