const { SlashCommandBuilder } = require("@discordjs/builders");
const Guild = require("../../database/schemas/Guild");
const Vc = require("../../database/schemas/tempvc");
const { MessageEmbed } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tempvc")
    .setDescription(" Enable/disable tempvc")
    .addStringOption((option) =>
      option
        .setName("toggle")
        .setDescription("Enable or disable tempvc")
        .setRequired(true),
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  cooldown: 10,
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const vcDB = await Vc.findOne(
      {
        guildId: interaction.guild.id,
      },
      (err, guild) => {
        if (err) console.error(err);
        if (!guild) {
          const newGuild = new Vc({
            _id: mongoose.Types.ObjectId(),
            guildId: interaction.guild.id,
            channelId: null,
            categoryID: null,
          });

          newGuild.save().catch((err) => console.error(err));

          return;
        }
      },
    );

    const language = require(`../../data/language/${guildDB.language}.json`);

    const toggle = interaction.options.getString("toggle");

    let prefix = guildDB.prefix;
    let fail = interaction.client.emoji.fail;

    let properUsage = new MessageEmbed()
      .setColor(interaction.guild.members.me.displayHexColor)
      .setDescription(`${language.tempvc1.replace(/{prefix}/g, `${prefix}`)}`)
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` });

    if (toggle.length < 1) {
      return interaction.reply({ embeds: [properUsage] });
    }

    if (toggle.includes("disable") || toggle.includes("off")) {
      if (!interaction.member.permissions.has("MANAGE_CHANNELS"))
        return interaction
          .reply({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTitle(`${fail} | ${language.missingUser}`)
                .setDescription(`${language.tempvc2}`)
                .setTimestamp()
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
          })
          .setColor(interaction.guild.members.me.displayHexColor);

      if (
        !vcDB.channelId ||
        !vcDB.categoryID ||
        !vcDB.guildId ||
        !vcDB.channelId === null
      )
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `${interaction.client.emoji.fail} | ${language.tempvc3}`,
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        });
      await Vc.findOne(
        {
          guildId: interaction.guild.id,
        },
        async (err, guild) => {
          let voiceID = guild.channelId;
          let categoryID = guild.categoryID;

          let voice = interaction.client.channels.cache.get(voiceID);
          if (voice) voice.delete().catch(() => {});

          let category = interaction.client.channels.cache.get(categoryID);
          if (category) category.delete().catch(() => {});

          if (!guild) {
            Vc.create({
              guildId: interaction.guild.id,
              channelId: null,
              categoryID: null,
            });

            return;
          } else {
            guild
              .updateOne({
                channelId: null,
                categoryID: null,
              })
              .catch((err) => console.error(err));
          }

          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.green)
                .setDescription(
                  `${interaction.client.emoji.success} | ${language.tempvc4}`,
                )
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
            ephemeral: true,
          });
        },
      );
      return;
    } else if (toggle.includes("enable") || toggle.includes("on")) {
      if (!interaction.member.permissions.has("MANAGE_CHANNELS"))
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle(`${fail} ${language.missingUser}`)
              .setDescription(language.tempvc2)
              .setTimestamp()
              .setFooter({ text: process.env.AUTH_DOMAIN }),
          ],
          ephemeral: true,
        });

      try {
        const embed = new MessageEmbed()
          .setAuthor({
            name: language.tempvc5,
            iconURL: "https://www.creeda.co.in/Images/loader.gif",
          })
          .setDescription(`\`${language.tempvc6}\``)
          .setColor(interaction.guild.members.me.displayHexColor);

        await interaction.reply({ embeds: [embed], fetchReply: true });

        const msg = await interaction.fetchReply();

        // ================= CATEGORY =================
        let category = interaction.guild.channels.cache.find(
          (c) =>
            c.name.toLowerCase() === "join to create" &&
            c.type === "GUILD_CATEGORY",
        );

        if (!category) {
          category = await interaction.guild.channels.create("Join to Create", {
            type: "GUILD_CATEGORY",
          });

          embed.setDescription(`**${language.tempvc7}**`);
          await interaction.editReply({ embeds: [embed] });
        } else {
          embed.setDescription(`**${language.tempvc8}**\n\nID: ${category.id}`);
          await interaction.editReply({ embeds: [embed] });
        }

        // ================= VOICE =================
        let voice = interaction.guild.channels.cache.find(
          (c) =>
            c.name.toLowerCase() === "join to create" &&
            c.type === "GUILD_VOICE",
        );

        if (!voice) {
          voice = await interaction.guild.channels.create("Join to create", {
            type: "GUILD_VOICE",
            parent: category.id,
          });

          embed.setDescription(`**${language.tempvc9}**`);
          await interaction.editReply({ embeds: [embed] });
        } else {
          embed.setDescription(`**${language.tempvc10}**\n\nID: ${voice.id}`);
          await interaction.editReply({ embeds: [embed] });
        }

        // ================= SAVE =================
        await Vc.findOneAndUpdate(
          { guildId: interaction.guild.id },
          {
            guildId: interaction.guild.id,
            channelId: voice.id,
            categoryID: category.id,
          },
          { upsert: true },
        );

        // ================= FINAL =================
        embed
          .setAuthor({
            name: language.tempvc12,
            iconURL: `${process.env.AUTH_DOMAIN}/logo.png`,
          })
          .setDescription(
            `**${language.tempvc13}** ${category.name}\n` +
              `ID: ${category.id}\n\n` +
              `**${language.tempvc14}** ${voice.name}\n` +
              `ID: ${voice.id}\n\n` +
              `${language.tempvc15} \`${prefix}tempvc off\``,
          )
          .setFooter({ text: `${interaction.client.config.botName} v2.5` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);

        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(language.tempvc16)
              .setColor("RED"),
          ],
          ephemeral: true,
        });
      }
    } else if (toggle[0]) {
      interaction.reply({ embeds: [properUsage] });
    } else {
      interaction.reply({ embeds: [properUsage] });
    }
  },
};
