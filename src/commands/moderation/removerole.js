const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "removerole",
      aliases: ["remrole"],
      description: "Removes the specified role from the mentioned user",
      category: "Moderation",
      usage: "<user>",
      examples: ["removerole @peter"],
      guildOnly: true,
      botPermission: ["MANAGE_ROLES"],
      userPermission: ["MANAGE_ROLES"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const fail = client.emoji.fail;
    const success = client.emoji.success;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    if (logging && logging.moderation.delete_after_executed === "true") {
      message.delete().catch(() => {});
    }

    let member =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!member)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} | Remove Role Error`)
            .setDescription("Please provide a valid role")
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });

    const role =
      getRoleFromMention(message, args[1]) ||
      message.guild.roles.cache.get(args[1]) ||
      message.guild.roles.cache.find(
        (rl) => rl.name.toLowerCase() === args.slice(1).join(" ").toLowerCase(),
      );

    let reason = `The current feature doesn't need reasons`;
    if (!reason) reason = "No Reason Provided";
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    if (!role)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} | Remove Role Error`)
            .setDescription("Please provide a valid role")
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });
    else if (!member.roles.cache.has(role.id))
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} | Remove Role Error`)
            .setDescription(`The provided user does not have the role.`)
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });
    else {
      try {
        await member.roles.remove(role, [
          `Role Remove / Responsible User: ${message.author.tag}`,
        ]);
        const embed = new MessageEmbed()

          .setDescription(
            ` ${success} | Removed **${role.name}** from **${member.user.tag}**`,
          )
          .setColor(client.color.green);
        message.channel
          .sendCustom({ embeds: [embed] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});

        if (logging && logging.moderation.role === "true") {
          const logChannel = message.guild.channels.cache.get(
            logging.moderation.channel,
          );
          if (logChannel) {
            let color = logging.moderation.color;
            if (color == "#000000") color = message.client.color.red;

            let logcase = logging.moderation.caseN || 1;
            const logEmbed = new MessageEmbed()
              .setAuthor({
                name: `Action: \`Remove Role\` | ${member.user.tag} | Case #${logcase}`,
                iconURL: member.user.displayAvatarURL({
                  format: "png",
                }),
              })
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                {
                  name: "Moderator",
                  value: `${message.member}`,
                  inline: true,
                },
              )
              .setFooter({ text: `ID: ${member.id}` })
              .setTimestamp()
              .setColor(color);

            send(
              logChannel,
              {
                embeds: [logEmbed],
              },
              {
                name: `${this.client.user.username}`,
                username: `${this.client.user.username}`,
                icon: this.client.user.displayAvatarURL({
                  dynamic: true,
                  format: "png",
                }),
              },
            ).catch((e) => console.log(e));

            logging.moderation.caseN = logcase + 1;
            await logging.save().catch(() => {});
          }
        }
      } catch (err) {
        message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              })
              .setTitle(`${fail} Remove Role Error`)
              .setDescription(
                `Unable to remove the user's role, please check the role hiarchy and make sure my role is above the provided user.`,
              )
              .setTimestamp()
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setColor(message.guild.members.me.displayHexColor),
          ],
        });
      }
    }
  }
};
function getRoleFromMention(message, mention) {
  if (!mention) return;
  const matches = mention.match(/^<@&(\d+)>$/);
  if (!matches) return;
  const id = matches[1];
  return message.guild.roles.cache.get(id);
}
