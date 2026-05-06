const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ban",
      aliases: ["b"],
      description: "Bans the specified user from your Discord server.",
      category: "Moderation",
      usage: "<user> [reason]",
      examples: ["ban @Peter Breaking the rules!"],
      guildOnly: true,
      botPermission: ["BAN_MEMBERS"],
      userPermission: ["BAN_MEMBERS"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({ guildId: message.guild.id });
    const language = require(`../../data/language/${guildDB.language}.json`);

    if (!args[0]) {
      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setDescription(`${client.emoji.fail} | ${language.banUserValid}`)
              .setColor(client.color.red),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });
    }

    const rawTargets = args[0].split(",").map((t) => t.trim());

    const targets = new Set();

    for (const t of rawTargets) {
      const mentionMatch = t.match(/^<@!?(\d{17,19})>$/);
      if (mentionMatch) {
        targets.add(mentionMatch[1]);
        continue;
      }

      if (/^\d{17,19}$/.test(t)) {
        targets.add(t);
      }
    }

    if (targets.size === 0) {
      return message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | ${language.banUserValid}`,
              ),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });
    }

    const results = {
      banned: [],
      failed: [],
    };

    let reason = args.slice(1).join(" ") || language.noReasonProvided;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    for (const userId of targets) {
      try {
        const user = await client.users.fetch(userId);

        if (user.id === message.author.id) {
          results.failed.push(message.author);
          continue;
        }

        // **DM the user before banning**
        let dmEmbed;
        if (
          logging &&
          logging.moderation.ban_action &&
          logging.moderation.ban_message.toggle === "false" &&
          logging.moderation.ban_action !== "1"
        ) {
          if (logging.moderation.ban_action === "2") {
            dmEmbed = `${client.emoji.fail} You've been banned in **${message.guild.name}**`;
          } else if (logging.moderation.ban_action === "3") {
            dmEmbed = `${client.emoji.fail} You've been banned in **${message.guild.name}**. | ${reason}`;
          } else if (logging.moderation.ban_action === "4") {
            dmEmbed = `${client.emoji.fail} You've been banned in **${message.guild.name}**. | ${reason}\n\n-# __**Moderator:**__ ${message.author} (${message.author.tag})`;
          }
        }

        try {
          await user
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.color.red)
                  .setDescription(dmEmbed),
              ],
            })
            .catch(() => {});
        } catch {
          console.log(`Could not send DM to ${user.tag}.`);
        }

        await message.guild.members.ban(user.id, {
          reason: `${reason} / Responsible user: ${message.author.tag}`,
        });

        results.banned.push(user);
      } catch {
        results.failed.push(userId);
      }
    }

    const isBanwave = targets.size > 1;

    if (!isBanwave) {
      if (results.failed[0]?.id === message.author.id) {
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | ${language.banYourselfError}.`,
              )
              .setColor(client.color.red),
          ],
        });
      } else {
        const embed = new MessageEmbed()
          .setDescription(
            `${client.emoji.success} | **${results.banned[0].tag}** ${language.banBan} ${
              logging && logging.moderation.include_reason === "true"
                ? `\n\n**Reason:** ${reason}`
                : ``
            }`,
          )
          .setColor(client.color.green);

        message.channel.sendCustom({ embeds: [embed] }).then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });
      }
    } else if (isBanwave) {
      const banwaveEmbed = new MessageEmbed()
        .setTitle(`${client.emoji.success} | Banwave Executed`)
        .setDescription(
          `${client.emoji.success} | **${results.banned.length} users** have been banned.`,
        )
        .addFields({
          name: "Users Banned",
          value: results.banned.map((u) => `• ${u.tag}`).join("\n"),
        })
        .setColor(client.color.green)
        .setFooter({ text: `Moderator: ${message.author.tag}` });

      if (logging && logging.moderation.include_reason === "true") {
        banwaveEmbed.addFields({ name: "Reason", value: reason });
      }

      message.channel.sendCustom({ embeds: [banwaveEmbed] }).then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => s.delete().catch(() => {}), 5000);
        }
      });
    }

    // Logging

    if (logging && logging.moderation.delete_after_executed === "true") {
      message.delete().catch(() => {});
    }
    if (logging && logging.moderation.ban === "true") {
      const logChannel = message.guild.channels.cache.get(
        logging.moderation.channel,
      );
      if (logChannel) {
        let color = logging.moderation.color;
        if (color == "#000000") color = message.client.color.red;

        let logcase = logging.moderation.caseN || 1;
        if (!isBanwave) {
          const logEmbed = new MessageEmbed()
            .setAuthor({
              name: `Action: \`Ban\` | ${results.banned[0].tag} | Case #${logcase}`,
              iconURL: results.banned[0].displayAvatarURL({ format: "png" }),
            })
            .addFields(
              { name: "User", value: `${results.banned[0]}`, inline: true },
              { name: "Moderator", value: `${message.member}`, inline: true },
              { name: "Reason", value: `${reason}`, inline: true },
            )
            .setFooter({ text: `ID: ${results.banned[0].id}` })
            .setTimestamp()
            .setColor(color);

          send(
            logChannel,
            {
              embeds: [logEmbed],
            },
            {
              name: `${client.user.username}`,
              username: `${client.user.username}`,
              iconURL: client.user.displayAvatarURL({
                dynamic: true,
                format: "png",
              }),
            },
          ).catch((e) => console.log(e));
        } else {
          const banwaveEmbed = new MessageEmbed()
            .setAuthor({
              name: `Action: \`Banwave\` | ${results.banned.length} Users | Case #${logcase}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .addFields(
              { name: "Moderator", value: `${message.member}`, inline: true },
              {
                name: "Users Banned",
                value: results.banned.map((u) => `• ${u.tag}`).join("\n"),
                inline: true,
              },
              { name: "Reason", value: reason, inline: true },
            )
            .setTimestamp()
            .setColor(color);

          if (results.failed.length) {
            banwaveEmbed.addFields({
              name: "Failed",
              value: results.failed.join("\n"),
              inline: true,
            });
          }

          send(
            logChannel,
            { embeds: [banwaveEmbed] },
            {
              name: `${client.user.username}`,
              username: `${client.user.username}`,
              iconURL: client.user.displayAvatarURL({
                dynamic: true,
                format: "png",
              }),
            },
          );
        }

        logging.moderation.caseN = logcase + 1;
        await logging.save().catch(() => {});
      }
    }
  }
};
