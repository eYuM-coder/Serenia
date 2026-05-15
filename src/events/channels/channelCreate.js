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

    const logging = await Logging.findOne({ guildId: channel.guild.id });
    if (!logging) return;

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    // Skip if channel name contains "Room"
    if (channel.name && channel.name.indexOf("Room") >= 0) return;

    const logChannelCreation = logging.server_events.channel_created;
    if (!logChannelCreation || logChannelCreation !== "true") return;

    if (logging.server_events.toggle !== "true") return;

    const channelEmbed = await channel.guild.channels.cache.get(
      logging.server_events.channel,
    );

    if (!channelEmbed) return;

    let color =
      logging.server_events.color === "#000000"
        ? this.client.color.green
        : logging.server_events.color;

    const guild = channel.guild;
    let fetchedLogs;
    let executor = null;

    try {
      fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelCreate,
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

    const description = [
      `The ${channel.name} channel was created by ${executor ? executor.tag : "Unknown"}.\n`,
      `Channel: ${channel}`,
      `Channel Type: ${CHANNEL_TYPE_MAP[channel.type] || "Unknown"}`,
      `Channel Name: ${channel.name}`,
    ];

    const embed = new EmbedBuilder()
      .setTitle(`:pencil: ***Channel Created***`)
      .setDescription(description.join("\n"))
      .setFooter({ text: `Channel ID: ${channel.id}` })
      .setTimestamp()
      .setColor(color);

    // Add parent category info if applicable
    if (channel.parent && channel.type !== ChannelType.GuildCategory) {
      embed.addFields({
        name: `Parent Category`,
        value: channel.parent.name,
        inline: true,
      });
    }

    // Add NSFW info for text channels
    if (channel.type === ChannelType.GuildText && channel.nsfw !== undefined) {
      embed.addFields({
        name: `NSFW`,
        value: channel.nsfw ? "Enabled" : "Disabled",
        inline: true,
      });
    }

    // Add slowmode info for text channels
    if (
      channel.type === ChannelType.GuildText &&
      channel.rateLimitPerUser > 0
    ) {
      embed.addFields({
        name: `Slowmode`,
        value: `${channel.rateLimitPerUser}s`,
        inline: true,
      });
    }

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
        console.error("Failed to send channel create log:", error);
      }
    }
  }
};
