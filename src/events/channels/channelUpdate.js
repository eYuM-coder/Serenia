const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index.js");
const permissions = require("../../assets/json/channelPermissions.json");

const channelUpdateQueue = new Map(); // key -> { embeds, timeout, channel }

module.exports = class extends Event {
  async run(oldChannel, newChannel) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });
    if (maintenance && maintenance.toggle === "true") return;

    // Skip if the channel isn't a ticket or contains "Room"
    if (
      !oldChannel.name.startsWith("ticket-") ||
      !newChannel.name.startsWith("ticket-")
    ) {
      if (oldChannel.name.includes("Room") || newChannel.name.includes("Room"))
        return;

      const logging = await Logging.findOne({ guildId: newChannel.guild.id });
      if (!logging || logging.server_events.toggle !== "true") return;

      const channelEmbed = oldChannel.guild.channels.cache.get(
        logging.server_events.channel,
      );
      if (!channelEmbed) return;

      const logChannelUpdate = logging.server_events.channel_update;
      if (!logChannelUpdate) return;

      const guild = newChannel.guild;
      let fetchedLogs;
      let overwriteLogs;

      try {
        // Fetch the most recent channel update audit log
        fetchedLogs = await guild.fetchAuditLogs({
          type: "CHANNEL_UPDATE",
          limit: 10,
        });
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        return;
      }

      try {
        overwriteLogs = await guild.fetchAuditLogs({
          type: "CHANNEL_OVERWRITE_UPDATE",
          limit: 10,
        });
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        return;
      }

      const auditEntry = fetchedLogs?.entries?.find(
        (e) =>
          e.target?.id === newChannel.id &&
          e.changes?.length &&
          Date.now() - e.createdTimestamp < 5000,
      );
      const overwriteEntry = overwriteLogs?.entries?.find(
        (e) =>
          e.target?.id === newChannel.id &&
          e.changes?.length &&
          Date.now() - e.createdTimestamp < 5000,
      );
      let executor = null;
      let reason = null;

      const entry = auditEntry || overwriteEntry;

      if (entry) {
        executor = entry.executor;
        reason = entry.reason;
      }

      if (!executor && !reason) {
        return;
      }

      let description = [];
      let color =
        logging.server_events.color === "#000000"
          ? "#FFFF00"
          : logging.server_events.color;
      let type =
        newChannel.type === "GUILD_CATEGORY"
          ? "Category"
          : newChannel.type === "GUILD_TEXT"
            ? "Text Channel"
            : "Voice Channel";

      description.push(`**Channel:** ${newChannel} (${newChannel.id})`);
      description.push(`**Updated By:** ${executor.tag} (${executor.id})`);
      description.push(`**Reason:** ${reason || "User action."}`);

      if (oldChannel.name !== newChannel.name) {
        description.push(
          `**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``,
        );
      }
      if (oldChannel.topic !== newChannel.topic) {
        description.push(
          `**Topic:** \`${oldChannel.topic || "None"}\` → \`${newChannel.topic || "None"}\``,
        );
      }
      if (oldChannel.nsfw !== newChannel.nsfw) {
        description.push(
          `**NSFW:** ${oldChannel.nsfw ? "Enabled" : "Disabled"} → ${newChannel.nsfw ? "Enabled" : "Disabled"}`,
        );
      }
      if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        description.push(
          `**Slowmode:** \`${oldChannel.rateLimitPerUser || "0"}s\` → \`${newChannel.rateLimitPerUser || "0"}s\``,
        );
      }

      // Compare Permissions
      const oldPerms = oldChannel.permissionOverwrites.cache;
      const newPerms = newChannel.permissionOverwrites.cache;
      let permChanges = [];

      // Check for added or updated permissions

      newPerms.forEach((newPerm, id) => {
        const oldPerm = oldPerms.get(id);

        let changes = [];

        const overwrite = newChannel.permissionOverwrites.cache.get(id);
        const isMember = overwrite?.type === 1;

        let mention;

        if (isMember) {
          const member = guild.members.cache.get(id);
          mention = member ? `<@${id}>` : `<@${id}>`; // fallback still pings user, no "unknown-user"
        } else {
          const role = guild.roles.cache.get(id);
          mention = role ? `<@&${id}>` : `<@&${id}>`; // fallback still shows role format
        }

        Object.entries(discord.Permissions.FLAGS).forEach(
          ([permName, flag]) => {
            const oldState = oldPerm?.allow?.has(flag)
              ? `${this.client.emoji.success}`
              : oldPerm?.deny?.has(flag)
                ? `${this.client.emoji.fail}`
                : "NONE";

            const newState = newPerm.allow.has(flag)
              ? `${this.client.emoji.success}`
              : newPerm.deny.has(flag)
                ? `${this.client.emoji.fail}`
                : "NONE";

            if (oldState !== newState) {
              changes.push(
                `${permissions[permName]}: ${oldState} → ${newState}`,
              );
            }
          },
        );

        if (changes.length > 0) {
          permChanges.push(`**${mention}** → ${changes.join(", ")}`);
        }
      });

      // Check for removed permissions
      oldPerms.forEach((oldPerm, id) => {
        if (!newPerms.has(id)) {
          const overwrite = oldChannel.permissionOverwrites.cache.get(id);
          const isMember = overwrite?.type === 1;

          const mention = isMember ? `<@${id}>` : `<@&${id}>`;

          permChanges.push(
            `**${mention}** → ${this.client.emoji.fail} Permissions Removed`,
          );
        }
      });

      if (permChanges.length > 0) {
        description.push(`**Permissions Updated:**\n${permChanges.join("\n")}`);
      }

      // Build Embed
      const embed = new discord.MessageEmbed()
        .setTitle(`:pencil: ***${type} Updated***`)
        .setFooter({ text: `Channel ID: ${newChannel.id}` })
        .setTimestamp()
        .setColor(color);
      if (description.join("\n").length > 4096) {
        embed.setDescription(description.join("\n").slice(0, 4093) + "...");
      } else {
        embed.setDescription(description.join("\n"));
      }

      // Send the log message
      if (
        channelEmbed.viewable &&
        channelEmbed
          .permissionsFor(guild.members.me)
          .has(["SEND_MESSAGES", "EMBED_LINKS"])
      ) {
        const key = channelEmbed.id;

        if (!channelUpdateQueue.has(key)) {
          channelUpdateQueue.set(key, {
            embeds: [],
            timeout: null,
            channel: channelEmbed,
          });
        }

        const data = channelUpdateQueue.get(key);

        data.embeds.push(embed);

        // reset timer every time (important)
        clearTimeout(data.timeout);

        data.timeout = setTimeout(() => {
          flushChannelUpdates(key, this.client);
        }, 100); // 100ms = basically instant but actually groups
      }
    }

    async function flushChannelUpdates(key, client) {
      const data = channelUpdateQueue.get(key);
      if (!data || data.embeds.length === 0) return;

      clearTimeout(data.timeout);

      const embedsToSend = data.embeds.splice(0, 10);

      try {
        await send(
          data.channel,
          { embeds: embedsToSend },
          {
            name: client.user.username,
            username: client.user.username,
            icon: client.user.displayAvatarURL({
              dynamic: true,
              format: "png",
            }),
          },
        );
      } catch (err) {
        console.error("Webhook batch send failed:", err);
      }

      if (data.embeds.length > 0) {
        flushChannelUpdates(key, client);
      } else {
        channelUpdateQueue.delete(key);
      }
    }
  }
};
