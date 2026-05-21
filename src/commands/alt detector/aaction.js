const Discord = require("discord.js");
const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const alt = require("../../database/models/altdetector.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "aaction",
      aliases: [],
      usage: "<ban | kick | none>",
      category: "Alt Detector",
      examples: ["aaction kick"],
      description: "Pick the action fired towards the alt.",
      cooldown: 5,
      userPermission: ["ManageGuild"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    let choices = ["none", "kick", "ban"];

    if (!args[0] || !choices.includes(args[0].toLowerCase())) {
      return message.channel.sendCustom({
        embeds: [
          new Discord.EmbedBuilder()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ format: "png" }),
            })
            .setDescription(
              `${message.client.emoji.fail} ${language.aactionNotValidChoice.replace(
                "{allChoices}",
                choices.join(", "),
              )}`,
            )
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setTimestamp()
            .setColor("Red"),
        ],
      });
    }

    const action = args[0].toLowerCase();

    const db = await alt.findOne({ guildID: message.guild.id });

    if (!db) {
      await alt
        .create({
          guildID: message.guild.id,
          altDays: 7,
          altModlog: "",
          allowedAlts: [],
          altAction: action,
          altToggle: false,
          notifier: false,
        })
        .catch(console.error);
    } else {
      await alt
        .updateOne(
          { guildID: message.guild.id },
          { $set: { altAction: action } },
        )
        .catch(console.error);
    }

    return message.channel.sendCustom({
      embeds: [
        new Discord.EmbedBuilder()
          .setAuthor({
            name: `${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ format: "png" }),
          })
          .setDescription(
            `${message.client.emoji.success} ${language.aactionSuccess.replace(
              "{action}",
              args[0],
            )}`,
          )
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
          .setTimestamp()
          .setColor("Red"),
      ],
    });
  }
};
