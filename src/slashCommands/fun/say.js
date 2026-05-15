const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say something")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to say")
        .setRequired(true),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const text = interaction.options.getString("message");

    interaction.reply({ content: text }).catch(() => {});
  },
};
