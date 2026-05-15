const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription(
      `Need help getting to the dashboard of ${config.botName}? Use this command!`,
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const dashembed = new EmbedBuilder()
      .setTitle(`Need ${config.botName}'s dashboard link?`)
      .setDescription(
        `Click [here](${process.env.AUTH_DOMAIN}/dashboard) to see ${config.botName}'s dashboard`,
      )
      .setColor("Random")
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setTimestamp();
    interaction.reply({ embeds: [dashembed], ephemeral: true });
  },
};
