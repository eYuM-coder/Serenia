const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { removeMoney } = require("../../utils/economy");
const { abbreviateNumber } = require("../../utils/parseAmount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Remove money from a user's wallet")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove the money from")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to remove")
        .setRequired(true),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    if (!user) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(interaction.client.color.red)
            .setDescription("Please mention a valid user!"),
        ],
      });
    }
    const amount = interaction.options.getString("amount");
    const profile = await getProfile({ userID: user.id });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(message.client.color.red)
            .setDescription(
              `${user} does not have a profile registered! They can use the /register command to register their profile.`,
            ),
        ],
        ephemeral: true,
      });
    } else {
      if (profile.wallet === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(message.client.color.red)
              .setDescription(
                `${user} does not have any money in their wallet to remove.`,
              ),
          ],
        });
      }

      await removeMoney(user.id, amount);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(interaction.client.color.green)
            .setDescription(
              `Removed $${abbreviateNumber(amount)} from ${user}.`,
            ),
        ],
      });
    }
  },
};
