const Event = require("../../structures/Event");
const discord = require("discord.js");
const Logging = require("../../database/schemas/logging");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(member) {
    const logging = await Logging.findOne({ guildId: member.guild.id });
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (logging) {
      if (logging.moderation.toggle == "true") {
        const channelEmbed = member.guild.channels.cache.get(
          logging.moderation.channel,
        );
        if (!channelEmbed) return;

        let color = logging.moderation.color;
        if (color == "#000000") color = member.client.color.red;
        let logcase = logging.moderation.caseN || 1;

        const auditLogs = await member.guild
          .fetchAuditLogs({
            limit: 1,
            type: "MEMBER_BAN_ADD",
          })
          .catch(() => {});
        if (!auditLogs) return;

        const banLog = auditLogs.entries.first();
        const executor = banLog ? banLog.executor : null;
        const reason = banLog?.reason || "No reason provided";

        if (!executor || executor.bot) return;

        if (logging.moderation.ban == "true") {
          const embed = new discord.MessageEmbed()
            .setAuthor({
              name: `Action: Ban | ${member.user.username} | Case #${logcase}`,
              iconURL: member.user.displayAvatarURL({ format: "png" }),
            })
            .addFields(
              { name: "User", value: member.user.tag, inline: true },
              {
                name: "Moderator",
                value: executor ? executor.tag : "Unknown",
                inline: true,
              },
              { name: "Reason", value: reason, inline: true },
            )
            .setFooter({ text: `ID: ${member.user.id}` })
            .setTimestamp()
            .setColor(color);

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
          ).catch(() => {});
        }

        logging.moderation.caseN = logcase + 1;
        await logging.save().catch(() => {});
      }
    }
  }
};
