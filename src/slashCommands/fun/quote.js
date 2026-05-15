const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Make a quoted text!")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to quote")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("This is optional"),
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });

      const language = require(`../../data/language/${guildDB.language}.json`);

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageMessages,
        )
      )
        return interaction.reply({ content: `${language.managemessages}` });

      let channel =
        interaction.options.getChannel("channel") || interaction.channel;

      if (!channel.isTextBased() || !channel.viewable)
        return interaction.reply({ content: `${language.notaccessible}` });

      const text = interaction.options.getString("text");

      if (
        !channel
          .permissionsFor(interaction.guild.members.me)
          .has([PermissionsBitField.Flags.SendMessages])
      )
        return interaction.reply({ content: `${language.sendmessages}` });

      if (
        !channel
          .permissionsFor(interaction.member)
          .has([PermissionsBitField.Flags.SendMessages])
      )
        return interaction.reply({ content: `${language.userSendMessages}` });

      interaction.reply({
        content: `Your message has been quoted.`,
        ephemeral: true,
      });

      channel
        .send({ content: `>>> ${text}`, allowedMentions: { parse: [] } })
        .catch(() => {});
    } catch {
      interaction.reply({
        content: "This command cannot be used in Direct Messages.",
        ephemeral: true,
      });
    }
  },
};
