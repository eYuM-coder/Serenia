const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { parseAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Add money to a users wallet.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to add")
        .setRequired(true),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("member");
    const amount = interaction.options.getInteger("amount");
    const profile = await Profile.findOne({
      userID: user.id,
    });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.yellow)
            .setDescription(
              `${user} does not have a profile registered! They can use the /register command to register their profile.`,
            ),
        ],
        ephemeral: true,
      });
    } else {
      await Profile.updateOne(
        {
          userID: user.id,
        },
        { $inc: { wallet: parseAmount(amount) } },
      );
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(`Added $${abbreviateNumber(amount)} to ${user}`),
        ],
      });
    }
  },
};
