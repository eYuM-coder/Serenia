const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging");
const send = require("../../packages/logs/index.js");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}

function parseDuration(str) {
  if (!str) return undefined;
  const direct = ms(str);
  if (direct !== undefined) return direct;
  const tokens = str.match(/\d+\s*[a-zA-Z]+/g);
  if (!tokens) return undefined;
  let total = 0;
  for (const token of tokens) {
    const val = ms(token.trim());
    if (val === undefined) return undefined;
    total += val;
  }
  return total || undefined;
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "mute",
      description:
        "Mutes (timeouts) the specified user from your Discord server.",
      category: "Moderation",
      usage: "<user> <duration> [reason]",
      examples: [
        "mute @Peter 1h spamming",
        "mute @Peter 1d Being disruptive",
        "mute @Peter 30m",
      ],
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

      if (!message.member.permissions.has("MODERATE_MEMBERS"))
        return message.channel.sendCustom({
          content: "You do not have permission to use this command.",
        });

      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]);
      const duration = args[1];
      let reason = args.slice(2).join(" ").trim() || "Not Specified";

      let time;
      if (duration) {
        time = parseDuration(duration);
      } else {
        time = ms("6h");
      }

      if (time && time < 60000) {
        time = ms("1m");
      }
      if (time && time > 2419200000) {
        time = ms("28d");
      }

      let formattedTime = time ? await usePrettyMs(time) : "";

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return message.channel
          .sendCustom({ embeds: [usernotfound] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (!time) {
        let timevalid = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | The time specified is not valid. It is necessary that you provide valid time.`,
          );

        return message.channel
          .sendCustom({ embeds: [timevalid] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          });
      }

      const response = await member.timeout(time, reason);

      if (response) {
        let timeoutsuccess = new MessageEmbed()
          .setColor(client.color.green)
          .setDescription(
            `***${client.emoji.success} | ${member} has been timed out for ${formattedTime}* || ${reason}**`,
          );
        await message.channel
          .sendCustom({ embeds: [timeoutsuccess] })
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
            dmEmbed = `${client.emoji.fail} You've been muted in **${message.guild.name}** for ${formattedTime}`;
          } else if (logging.moderation.mute_action === "3") {
            dmEmbed = `${client.emoji.fail} You've been muted in **${message.guild.name}** for ${formattedTime}\n\n__**Reason:**__ ${reason}`;
          } else if (logging.moderation.mute_action === "4") {
            dmEmbed = `${client.emoji.fail} You've been muted in **${message.guild.name}** for ${formattedTime}\n\n__**Moderator:**__ ${message.author} **(${message.author.tag})**\n__**Reason:**__ ${reason}`;
          }

          member
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.color.red)
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
                name: `Action: Timeout | ${member.user.tag} | Case #${logcase}`,
                iconURL: member.user.displayAvatarURL({ format: "png" }),
              })
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                { name: "Moderator", value: `${message.member}`, inline: true },
                { name: "Duration", value: `${formattedTime}`, inline: true },
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
          `${client.emoji.fail} | This user is a mod/admin, I can't do that.`,
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
              `${message.client.emoji.fail} | An error occurred while trying to mute this member.`,
            ),
        ],
      });
    }
  }
};
