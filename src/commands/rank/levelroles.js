const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const LevelRole = require("../../database/models/levelRoles");

async function getConfig(guildId) {
  return (
    (await LevelRole.findOne({ guildId })) ??
    (await LevelRole.create({ guildId, stackRoles: false, roles: [] }))
  );
}

function baseEmbed(title, color = "#3498db") {
  return new MessageEmbed().setTitle(title).setColor(color);
}

const USAGE = `\`\`\`
levelroles add <level> <@role>    — Assign a role to a level
levelroles remove <level>         — Remove the role from a level
levelroles list                   — Show all level roles
levelroles stack <on|off>         — Toggle role stacking
levelroles clear                  — Remove all level role assignments
\`\`\``;

async function handleAdd(message, args) {
  const level = parseInt(args[1]);
  const role =
    message.mentions.roles.first() ??
    message.guild.roles.cache.get(args[2]?.replace(/\D/g, ""));

  if (!level || isNaN(level) || level < 1) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | Please provide a valid level (1 or higher).\nUsage: \`levelroles add <level> <@role>\``,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  if (!role) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | Please mention a valid role.\nUsage: \`levelroles add <level> <@role>\``,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  if (role.managed || role.id === message.guild.id) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | You cannot use managed roles (e.g. bot roles) or \`@everyone\` as level rewards.`,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const config = await getConfig(message.guild.id);

  const duplicateLevel = config.roles.find((r) => r.level === level);
  if (duplicateLevel) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | Level **${level}** already has <@&${duplicateLevel.roleId}> assigned. Remove it first with \`levelroles remove ${level}\`.`,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const duplicateRole = config.roles.find((r) => r.roleId === role.id);
  if (duplicateRole) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | <@&${role.id}> is already assigned to level **${duplicateRole.level}**.`,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  config.roles.push({ level, roleId: role.id });
  config.roles.sort((a, b) => a.level - b.level);
  await config.save();

  const embed = baseEmbed(
    `${message.client.emoji.success} | Level Role Added`,
    message.client.color.green,
  )
    .setDescription(`<@&${role.id}> will now be awarded at level **${level}**.`)
    .addFields({
      name: "Stack mode",
      value: config.stackRoles
        ? "🟢 **Enabled** — users keep all previous level roles."
        : "🔴 **Disabled** — previous level roles are swapped out.",
    });

  return message.channel.sendCustom({ embeds: [embed] });
}

async function handleRemove(message, args) {
  const level = parseInt(args[1]);

  if (!level || isNaN(level)) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | Please provide a valid level number.\nUsage: \`levelroles remove <level>\``,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const config = await getConfig(message.guild.id);
  const index = config.roles.findIndex((r) => r.level === level);

  if (index === -1) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | No role is assigned to level **${level}**.`,
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const [removed] = config.roles.splice(index, 1);
  await config.save();

  const embed = baseEmbed(
    "🗑️ Level Role Removed",
    message.client.color.green,
  ).setDescription(
    `<@&${removed.roleId}> has been unlinked from level **${level}**.`,
  );

  return message.channel.sendCustom({ embeds: [embed] });
}

async function handleList(message) {
  const config = await getConfig(message.guild.id);

  if (!config.roles.length) {
    return message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setDescription(
              "ℹ️ No level roles have been set up yet. Use `levelroles add` to get started.",
            ),
        ],
      })
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const rows = [...config.roles]
    .sort((a, b) => a.level - b.level)
    .map(({ level, roleId }) => {
      const discordRole = message.guild.roles.cache.get(roleId);
      const mention = discordRole
        ? `<@&${roleId}>`
        : `~~<@&${roleId}>~~ *(deleted)*`;
      return `**Level ${level}** → ${mention}`;
    });

  const embed = baseEmbed("🎖️ Level Roles")
    .setDescription(rows.join("\n"))
    .addFields({
      name: "Stack mode",
      value: config.stackRoles
        ? "🟢 **Enabled** — users accumulate all earned roles."
        : "🔴 **Disabled** — only the highest earned role is kept.",
    })
    .setFooter({
      text: `${config.roles.length} role${config.roles.length === 1 ? "" : "s"} configured`,
    });

  return message.channel.sendCustom({ embeds: [embed] });
}

async function handleStack(message, args) {
  const input = args[1]?.toLowerCase();

  if (!input || !["on", "off"].includes(input)) {
    return message.channel
      .sendCustom(
        `❌ Please specify \`on\` or \`off\`.\nUsage: \`levelroles stack <on|off>\``,
      )
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const enabled = input === "on";
  const config = await getConfig(message.guild.id);

  if (config.stackRoles === enabled) {
    return message.channel.sendCustom(
      `ℹ️ Stack mode is already **${enabled ? "enabled" : "disabled"}**.`,
    );
  }

  config.stackRoles = enabled;
  await config.save();

  const embed = baseEmbed(
    enabled ? "🟢 Stack Mode Enabled" : "🔴 Stack Mode Disabled",
    enabled ? message.client.color.green : message.client.color.red,
  ).setDescription(
    enabled
      ? "Users will **keep all** previously earned level roles when they level up."
      : "Users will **only hold the highest** level role they have earned. Previous level roles are removed on level-up.",
  );

  return message.channel.sendCustom({ embeds: [embed] });
}

async function handleClear(message) {
  const config = await getConfig(message.guild.id);

  if (!config.roles.length) {
    return message.chanenl
      .sendCustom("ℹ️ There are no level roles to clear.")
      .then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
  }

  const count = config.roles.length;
  config.roles = [];
  await config.save();

  const embed = baseEmbed(
    "🗑️ Level Roles Cleared",
    message.client.color.red,
  ).setDescription(
    `All **${count}** level role${count === 1 ? "" : "s"} have been removed.`,
  );

  return message.channel.sendCustom({ embeds: [embed] });
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "levelroles",
      description: "Configure roles that are awarded when members level up.",
      category: "Leveling",
      usage: [
        "levelroles add <level> <@role>",
        "levelroles remove <level>",
        "levelroles list",
        "levelroles stack <on|off>",
        "levelroles clear",
      ],
      cooldown: 3,
      userPermission: ["MANAGE_ROLES"],
      botPermission: ["MANAGE_ROLES"],
    });
  }

  async run(message, args) {
    const sub = args[0]?.toLowerCase();

    const handlers = {
      add: handleAdd,
      remove: handleRemove,
      list: handleList,
      stack: handleStack,
      clear: handleClear,
    };

    const handler = handlers[sub];

    if (!handler) {
      const embed = baseEmbed("🎖️ Level Roles — Help")
        .setDescription(USAGE)
        .setFooter({
          text: "Only those with the Manage Roles permission can use this command.",
        });
      return message.channel.sendCustom({ embeds: [embed] }).then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 10000);
      });
    }

    return handler(message, args);
  }
};
