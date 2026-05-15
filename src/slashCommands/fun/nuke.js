const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription('"Nukes" a server')
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setDescription("Are you sure?")
        .setColor("#FF0000");
      await interaction.reply({ embeds: [embed] });

      const filter = (m) => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (m) => {
        const firstInput = m.content;

        if (firstInput.toLowerCase() === "yes") {
          const embed = new EmbedBuilder()
            .setDescription("SO YOU WANT ME TO NUKE THE SERVER, CORRECT?")
            .setColor("#FF0000");
          await interaction.channel.send({ embeds: [embed] });
        } else {
          collector.stop();
          return interaction.channel.send({
            content: "Canceling interaction.",
          });
        }

        collector.stop();

        const secondCollector = interaction.channel.createMessageCollector({
          filter,
          time: 60000,
        });

        secondCollector.on("collect", async (m) => {
          const secondInput = m.content;

          if (secondInput.toLowerCase() === "yes") {
            const embed = new EmbedBuilder()
              .setDescription(`Yeah, uh... Let's actually not do that.`)
              .setColor("#FF0000");
            secondCollector.stop();
            return interaction.channel.send({ embeds: [embed] });
          } else {
            secondCollector.stop();
            return interaction.channel.send({
              content: "Glad you made the right choice, bud.",
            });
          }
        });
        secondCollector.on("end", (collected, reason) => {
          if (reason == "time") {
            return interaction.channel.send({
              content: "You took too long to provide an answer.",
            });
          }
        });

        collector.on("end", (collected, reason) => {
          if (reason == "time") {
            return interaction.channel.send({
              content: "You took too long to provide an answer.",
            });
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  },
};
