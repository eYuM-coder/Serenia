const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const Guild = require("../../database/schemas/Guild.js");
const warnModel = require("../../database/models/moderation.js");
const ReactionMenu = require("../../data/ReactionMenu.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "warnings",
      aliases: ["warns", "ws"],
      description: "Check a user's warnings",
      category: "Moderation",
      usage: "<user>",
      guildOnly: true,
      botPermission: ["ADD_REACTIONS"],
    });
  }

  async run(message, args) {
    try {
      let client = message.client;

      if (!message.member.permissions.has("MANAGE_MESSAGES")) {
        return message.reply("You do not have permission to use this command.");
      }

      const guildDB = await Guild.findOne({
        guildId: message.guild.id,
      });

      let language = require(`../../data/language/${guildDB.language}.json`);

      const mentionedMember =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.member;

      const warnDoc = await warnModel.findOne({
        guildID: message.guild.id,
        memberID: mentionedMember.id,
      });

      if (!warnDoc || !warnDoc.warnings.length) {
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | **${mentionedMember.user.tag}** ${language.warningsNoError}`,
              )
              .setColor(client.color.red)
              .setTimestamp(),
          ],
        });
      }

      const count = warnDoc.warnings.length;

      // ✅ CLEAN embed builder (no reuse, no mutation bugs)
      const buildEmbed = (current) => {
        const embed = new MessageEmbed()
          .setColor(client.color.blue)
          .setTimestamp()
          .setAuthor({
            name: mentionedMember.user.tag,
            iconURL: mentionedMember.user.displayAvatarURL({ dynamic: true }),
          })
          .setFooter({
            text: `${language.warnExpire}\n${message.member.displayName}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });

        const max = count > current + 4 ? current + 4 : count;
        let amount = 0;

        for (let i = current; i < max; i++) {
          let mod = message.guild.members.cache.get(warnDoc.moderator[i]);
          let reason = warnDoc.warnings[i];

          if (reason.length > 1000) {
            reason = reason.slice(0, 1000) + "...";
          }

          embed.addFields(
            {
              name: "\u200b",
              value: `**${language.warnName || "Warn"} \`#${i + 1}\`**`,
            },
            {
              name: language.warnModerator || "Moderator",
              value: mod ? mod.toString() : "Unknown",
              inline: true,
            },
            {
              name: language.warnAction || "Action",
              value: warnDoc.modType[i] || "Unknown",
              inline: true,
            },
            {
              name: language.warnReason || "Reason",
              value: reason,
              inline: true,
            },
            {
              name: language.warnID || "ID",
              value: `${warnDoc.warningID[i] || i + 1}`,
              inline: true,
            },
            {
              name: language.warnDateIssued || "Date",
              value: moment(warnDoc.date[i]).format("dddd, MMMM Do YYYY"),
            },
          );

          amount++;
        }

        return embed
          .setTitle(`${language.warnList} [${current} - ${max}]`)
          .setDescription(
            `Showing \`${amount}\` of ${mentionedMember}'s \`${count}\` total warns.`,
          );
      };

      // ✅ No pagination needed
      if (count <= 4) {
        return message.channel.sendCustom({ embeds: [buildEmbed(0)] });
      }

      // 🔁 Pagination
      let n = 0;

      const first = () => {
        if (n === 0) return;
        n = 0;
        return buildEmbed(n);
      };

      const previous = () => {
        if (n === 0) return;
        n -= 4;
        if (n < 0) n = 0;
        return buildEmbed(n);
      };

      const next = () => {
        if (n + 4 >= count) return;
        n += 4;
        return buildEmbed(n);
      };

      const last = () => {
        const cap = Math.floor((count - 1) / 4) * 4;
        if (n === cap) return;
        n = cap;
        return buildEmbed(n);
      };

      const reactions = {
        "⏪": first,
        "◀️": previous,
        "⏹️": null,
        "▶️": next,
        "⏩": last,
      };

      const menu = new ReactionMenu(
        client,
        message.channel,
        message.member,
        buildEmbed(0),
        null,
        null,
        reactions,
        180000,
      );

      menu.reactions["⏹️"] = menu.stop.bind(menu);
    } catch (err) {
      console.error(err);
      message.reply("Something went wrong.");
    }
  }
};
