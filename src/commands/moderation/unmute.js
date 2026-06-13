const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "unmute",
      description:
        "Unmutes (removes timeout) the specified user from your Discord server.",
      category: "Moderation",
      usage: "<user> [reason]",
      examples: ["unmute @Peter", "unmute @Peter Appeal accepted"],
      cooldown: 5,
      userPermission: ["MODERATE_MEMBERS"],
      botPermission: ["MODERATE_MEMBERS"],
    });
  }
  async run(message, args) {
    try {
      const client = message.client;
      const logging = await Logging.findOne({
        guildId: message.guild.id,
      });

      if (logging && logging.moderation.delete_after_executed === "true") {
        await message.delete().catch(() => {});
      }

      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]);
      let reason = args.slice(1).join(" ").trim();
      reason = reason || "Not Specified";

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return message.channel
          .send({ embeds: [usernotfound] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      const response = await member.timeout(null, reason);

      if (response) {
        let unmuteSuccess = new MessageEmbed()
          .setColor(client.color.green)
          .setDescription(
            `***${client.emoji.success} | ${member} has been unmuted.* || ${reason}**`,
          );
        await message.channel
          .send({ embeds: [unmuteSuccess] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => s.delete().catch(() => {}), 5000);
            }
          })
          .catch(() => {});

        let dmEmbed;
        if (
          logging &&
          logging.moderation.mute_action &&
          logging.moderation.mute_action !== "1"
        ) {
          if (logging.moderation.mute_action === "2") {
            dmEmbed = `${client.emoji.fail} You've been unmuted in **${message.guild.name}**`;
          } else if (logging.moderation.mute_action === "3") {
            dmEmbed = `${client.emoji.fail} You've been unmuted in **${message.guild.name}**\n\n__**Reason:**__ ${reason}`;
          } else if (logging.moderation.mute_action === "4") {
            dmEmbed = `${client.emoji.fail} You've been unmuted in **${message.guild.name}**\n\n__**Moderator:**__ ${message.author} **(${message.author.tag})**\n__**Reason:**__ ${reason}`;
          }

          member
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.color.green)
                  .setDescription(dmEmbed),
              ],
            })
            .catch(() => {});
        }

        if (logging && logging.moderation.mute === "true") {
          const logChannel = message.guild.channels.cache.get(
            logging.moderation.channel,
          );
          if (logChannel) {
            let color = logging.moderation.color;
            if (color == "#000000") color = client.color.red;

            let logcase = logging.moderation.caseN || 1;
            const logEmbed = new MessageEmbed()
              .setAuthor({
                name: `Action: Unmute | ${member.user.tag} | Case #${logcase}`,
                iconURL: member.user.displayAvatarURL({ format: "png" }),
              })
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                { name: "Moderator", value: `${message.member}`, inline: true },
                { name: "Reason", value: `${reason}`, inline: true },
              )
              .setFooter({ text: `ID: ${member.id}` })
              .setTimestamp()
              .setColor(color);

            send(
              logChannel,
              { embeds: [logEmbed] },
              {
                name: `${this.client.user.username}`,
                username: `${this.client.user.username}`,
                icon: this.client.user.displayAvatarURL({
                  dynamic: true,
                  format: "png",
                }),
              },
            ).catch(() => {});

            logging.moderation.caseN = logcase + 1;
            await logging.save().catch(() => {});
          }
        }

        return;
      }

      let failembed = new MessageEmbed()
        .setColor(client.color.red)
        .setDescription(
          `${client.emoji.fail} | That person is a mod/admin, I can't do that.`,
        )
        .setTimestamp();
      return message.channel.sendCustom({ embeds: [failembed] });
    } catch (err) {
      console.error(err);
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | An error occurred while trying to unmute this member.`,
            ),
        ],
      });
    }
  }
};
