const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const { stripIndent } = require("common-tags");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns the ping of the bot.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes(0),
  async execute(interaction) {
    let guildDB = {};
    try {
      guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });
    } catch {
      guildDB = { language: "english" };
    }
    const client = interaction.client;
    const language = require(`../../data/language/${guildDB.language}.json`);
    const embed = new EmbedBuilder()
      .setDescription(`Pinging...`)
      .setColor(client.color.red)
      .setFooter({ text: `Powered by ${process.env.AUTH_DOMAIN}` });

    await interaction.reply({ embeds: [embed], withResponse: true });
    const msg = await interaction.fetchReply();

    const vowel = ["a", "e", "i", "u", "u"];

    const latency = msg.createdTimestamp - interaction.createdTimestamp;
    const wsPing =
      client.ws.ping === -1
        ? "Calculating..."
        : `${Math.round(client.ws.ping)}ms`;

    let koko = stripIndent`
        **${language.timeTaken}** \`${latency}ms\`
        **${language.discordAPI}** \`${wsPing}\`
        `;

    let color = "";
    if (latency < 250) {
      color = `#00ff00`;
    } else if (latency > 250 && latency < 750) {
      color = `#CCCC00`;
    } else if (latency > 750) {
      color = interaction.client.color.red;
    }

    embed.setDescription(
      `P${vowel[Math.floor(Math.random() * vowel.length)]}ng\n${koko}`,
    );
    embed.setColor(color);
    interaction.editReply({ embeds: [embed] });
  },
};
