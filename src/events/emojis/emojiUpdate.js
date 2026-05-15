const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const {
  PermissionFlagsBits,
  EmbedBuilder,
  AuditLogEvent,
} = require("discord.js");
const maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(oldEmoji, newEmoji) {
    const logging = await Logging.findOne({ guildId: newEmoji.guild.id });

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await oldEmoji.guild.channels.cache.get(
          logging.server_events.channel,
        );

        let description = [];

        const guild = newEmoji.guild;
        const fetchedLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.EmojiUpdate,
          limit: 1,
        });
        const auditEntry = fetchedLogs.entries.first();
        const executor = auditEntry ? auditEntry.executor : null;

        description.push(
          `The ${emoji.name} emoji was updated by ${
            executor ? executor : "Unknown"
          }.\n`,
        );
        description.push(`Emoji Name: ${oldEmoji.name} --> ${newEmoji.name}`);
        description.push(`Emoji: ${newEmoji}`);
        description.push(`Full ID: \`<:${newEmoji.name}:${oldEmoji.id}>\``);

        if (channelEmbed) {
          let color =
            logging.server_events.color === "#000000"
              ? this.client.color.yellow
              : logging.server_events.color;

          if (logging.server_events.emoji_update == "true") {
            const embed = new EmbedBuilder()
              .setTitle(`:pencil: ***Emoji Updated***`)
              .setDescription(description.join("\n"))
              .setFooter({ text: `Emoji ID: ${oldEmoji.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(newEmoji.guild.members.me)
                .has([
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.EmbedLinks,
                ])
            ) {
              send(
                channelEmbed,
                { embeds: [embed] },
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
