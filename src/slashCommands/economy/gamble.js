const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { parseAmount } = require("../../utils/parseAmount");
const { getProfile, addMoney, removeMoney } = require("../../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble your money in different games")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("coinflip")
        .setDescription("Flip a coin and bet your money")
        .addStringOption((option) =>
          option
            .setName("choice")
            .setDescription("Heads or tails")
            .setRequired(true)
            .addChoices(
              { name: "heads", value: "heads" },
              { name: "tails", value: "tails" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("bet")
            .setDescription("Amount to bet (or use a shorthand)")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const profile = await getProfile({ userID: interaction.user.id });

    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "You do not have a profile registered!\nUse /register to start.",
            ),
        ],
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "coinflip") {
      const wallet = profile.wallet;

      const choice = interaction.options.getString("choice");
      const betInput = interaction.options.getString("bet");
      const bet = parseAmount(betInput, wallet);

      if (!bet || isNaN(bet)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription("Enter a valid bet amount."),
          ],
          ephemeral: true,
        });
      }

      if (bet <= 0) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription("Bet must be higher than 0."),
          ],
          ephemeral: true,
        });
      }

      if (bet > wallet) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription("You don't have enough money for that bet."),
          ],
          ephemeral: true,
        });
      }

      const result = Math.random() < 0.5 ? "heads" : "tails";
      const win = choice === result;

      if (win) {
        await addMoney(interaction.user.id, bet * 2);

        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle("Coinflip Won!")
              .setDescription(
                `You picked **${choice}**\nResult: **${result}**\n\nYou won **$${bet * 2}** 🪙`,
              ),
          ],
        });
      } else {
        await removeMoney(interaction.user.id, bet);

        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setTitle("Coinflip Lost!")
              .setDescription(
                `You picked **${choice}**\nResult: **${result}**\n\nYou lost **$${bet}** 💀`,
              ),
          ],
        });
      }
    }
  },
};
