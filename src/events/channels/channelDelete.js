const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const { AuditLogEvent, EmbedBuilder, ChannelType } = require("discord.js");
const send = require("../../packages/logs/index.js");
const Maintenance = require("../../database/schemas/maintenance");

const CHANNEL_TYPE_MAP = {
  [ChannelType.GuildText]: "Text channel",
  [ChannelType.GuildVoice]: "Voice channel",
  [ChannelType.GuildCategory]: "Category",
  [ChannelType.GuildAnnouncement]: "Announcement channel",
  [ChannelType.GuildStageVoice]: "Stage channel",
  [ChannelType.GuildForum]: "Forum channel",
};

module.exports = class extends Event {
  async run(channel) {
    if (!channel) return;

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: channel.guild.id });
    if (!logging) return;

    const logChannelDeletion = logging.server_events.channel_delete;
    if (!logChannelDeletion || logChannelDeletion !== "true") return;

    if (logging.server_events.toggle !== "true") return;

    // Skip if channel name contains "Room"
    if (channel.name && channel.name.indexOf("Room") >= 0) return;

    const channelEmbed = await channel.guild.channels.cache.get(
      logging.server_events.channel,
    );

    if (!channelEmbed) return;

    let description = [];
    const guild = channel.guild;
    let fetchedLogs;
    let executor = null;

    try {
      fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 10,
      });

      const auditEntry = fetchedLogs.entries.find(
        (e) =>
          e.target?.id === channel.id && Date.now() - e.createdTimestamp < 3000,
      );

      executor = auditEntry ? auditEntry.executor : null;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }

    description.push(
      `The ${channel.name} channel was deleted by ${executor ? executor.tag : "Unknown"}.\n`,
    );
    description.push(
      `Channel Type: ${CHANNEL_TYPE_MAP[channel.type] || "Unknown"}`,
    );
    description.push(`Channel Name: ${channel.name}`);

    // Add parent category info if available
    if (channel.parent) {
      description.push(`Parent Category: ${channel.parent.name}`);
    }

    let color =
      logging.server_events.color === "#000000"
        ? this.client.color.red
        : logging.server_events.color;

    const embed = new EmbedBuilder()
      .setTitle(`:wastebasket: ***Channel Deleted***`)
      .setDescription(description.join("\n"))
      .setFooter({ text: `Channel ID: ${channel.id}` })
      .setTimestamp()
      .setColor(color);

    // Check permissions and send
    if (
      channelEmbed.viewable &&
      channelEmbed
        .permissionsFor(channel.guild.members.me)
        .has(["SendMessages", "EmbedLinks"])
    ) {
      try {
        await send(
          channelEmbed,
          { embeds: [embed] },
          {
            name: `${this.client.user.username}`,
            username: `${this.client.user.username}`,
            icon: this.client.user.displayAvatarURL({
              dynamic: true,
              format: "png",
            }),
          },
        );
      } catch (error) {
        console.error("Failed to send channel delete log:", error);
      }
    }
  }
};
