const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");
const { updateProfile, getProfile } = require("../../utils/economy.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("monthly")
    .setDescription("Collect your monthly coins. 30d cooldown.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const MONTH = 2592000000;
    const REWARD = 2500000;

    const profile = await getProfile({
      userID: interaction.user.id,
    });

    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.yellow)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`,
            ),
        ],
        ephemeral: true,
      });
    }

    const now = Date.now();
    const lastMonthlyMs = profile.lastMonthly
      ? new Date(profile.lastMonthly).getTime()
      : 0;
    const timeSince = now - lastMonthlyMs;

    if (timeSince < MONTH && lastMonthlyMs !== 0) {
      const timeLeft = Math.round((lastMonthlyMs + MONTH - now) / 1000);
      const d = Math.floor(timeLeft / 86400);
      const h = Math.floor((timeLeft % 86400) / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60; // Using 60 this time! ;)

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setTitle(`${interaction.user.username}'s Monthly income cooldown`)
            .setDescription(
              `You have to wait **${d}d ${h}h ${m}m ${s}s** before you can collect again! \nNext claim available: <t:${Math.round((lastMonthlyMs + MONTH) / 1000)}:R>`,
            ),
        ],
        ephemeral: true,
      });
    }

    // --- DATABASE UPDATE ---
    // Consolidating $set and $inc into one call
    await updateProfile(
      { userID: interaction.user.id },
      {
        $set: { lastMonthly: new Date(now) },
        $inc: { wallet: REWARD },
      },
    );

    // --- SUCCESS REPLY ---
    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(interaction.client.color.green)
          .setTitle(`${interaction.user.username}'s Monthly income`)
          .setDescription(
            `You have collected your monthly earnings of **$2,500,000**.\nCome back <t:${Math.round((now + MONTH) / 1000)}:R> to collect more.`,
          ),
      ],
    });
  },
};
