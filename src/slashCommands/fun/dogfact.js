const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dogfact")
    .setDescription("Generate a random dog fact")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const res = await fetch("https://dogapi.dog/api/facts");
    const fact = (await res.json()).facts[0];

    const embed = new EmbedBuilder()
      .setDescription(`${fact}`)
      .setFooter({ text: `/dog-api.kinduff/api/fact` })
      .setTimestamp()
      .setColor(interaction.client.color.blue);
    interaction.reply({ embeds: [embed] }).catch(() => {});
  },
};
