const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("catfact")
    .setDescription("Generate random cat facts")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const res = await fetch("https://catfact.ninja/fact").catch(() => {});
    const fact = (await res.json()).fact;
    const embed = new EmbedBuilder()
      .setDescription(`${fact}`)
      .setFooter({ text: `/catfact.ninja/fact` })
      .setTimestamp()
      .setColor(interaction.client.color.blue);
    interaction.reply({ embeds: [embed] }).catch(() => {});
  },
};
