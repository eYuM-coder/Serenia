const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("explode")
    .setDescription("Says WTF boom")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    let embed = new EmbedBuilder()
      .setDescription(`WHAT THE FU- *explosion*`)
      .setColor("Random")
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();
    interaction.reply({ embeds: [embed] });
  },
};
