const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(emoji) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: emoji.guild.id });

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await emoji.guild.channels.cache.get(
          logging.server_events.channel,
        );

        let description = [];

        const guild = emoji.guild;
        const fetchedLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.EmojiCreate,
          limit: 1,
        });
        const auditEntry = fetchedLogs.entries.first();
        const executor = auditEntry ? auditEntry.executor : null;

        description.push(
          `The ${emoji.name} emoji was created by ${
            executor ? executor : "Unknown"
          }.\n`,
        );
        description.push(`Emoji Name: ${emoji.name}`);
        description.push(`Emoji: ${emoji}`);
        description.push(`Full ID: \`<:${emoji.name}:${emoji.id}>\``);

        if (channelEmbed) {
          let color =
            logging.server_events.color === "#000000"
              ? this.client.color.green
              : logging.server_events.color;

          if (logging.server_events.emoji_update == "true") {
            const embed = new EmbedBuilder()
              .setTitle(`🆕 ***Emoji Created***`)
              .setDescription(description.join("\n"))
              .setFooter({ text: `Emoji ID: ${emoji.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(emoji.guild.members.me)
                .has(["SendMessages", "EmbedLinks"])
            ) {
              send(
                channelEmbed,
                {
                  embeds: [embed],
                },
                {
                  name: `${this.client.user.username}`,
                  username: `${this.client.user.username}`,
                },
              ).catch(() => {});
            }
          }
        }
      }
    }
  }
};
