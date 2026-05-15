const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birdfact")
    .setDescription("Generate random bird facts")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const res = await fetch("https://some-random-api.com/facts/bird").catch(
      () => {},
    );

    const fact = (await res.json()).fact;

    if (!res) {
      return interaction.reply({
        content: `The API is currectly down, come back later!`,
        ephemeral: true,
      });
    }
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(interaction.client.color.blue)
          .setDescription(`${fact}`)
          .setFooter({ text: "/some-random-api/bird" }),
      ],
    });
  },
};
