const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { updateProfile, getProfile } = require("../../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Collect your weekly earnings.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const WEEK = 604800000; // 7 days in ms
    const REWARD = 500000;

    const profile = await getProfile({ userID: interaction.user.id });

    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`,
            ),
        ],
        ephemeral: true,
      });
    }

    const now = Date.now();
    const lastWeeklyMs = profile.lastWeekly
      ? new Date(profile.lastWeekly).getTime()
      : 0;
    const timeSince = now - lastWeeklyMs;

    // --- COOLDOWN CHECK ---
    if (timeSince < WEEK && lastWeeklyMs !== 0) {
      const timeLeft = Math.round((lastWeeklyMs + WEEK - now) / 1000);
      const d = Math.floor(timeLeft / 86400);
      const h = Math.floor((timeLeft % 86400) / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60;

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setTitle(`${interaction.user.username}'s Weekly`)
            .setDescription(
              `You have to wait **${d}d ${h}h ${m}m ${s}s** before you can collect again!\nNext claim: <t:${Math.round((lastWeeklyMs + WEEK) / 1000)}:R>`,
            ),
        ],
        ephemeral: true,
      });
    }

    // --- DATABASE UPDATE ---
    await updateProfile(
      { userID: interaction.user.id },
      {
        $set: { lastWeekly: new Date(now) },
        $inc: { wallet: REWARD },
      },
    );

    // --- SUCCESS REPLY ---
    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(interaction.client.color.green)
          .setTitle(`${interaction.user.username}'s Weekly`)
          .setDescription(
            `You have collected your weekly earnings of **$500,000**.\nCome back <t:${Math.round((now + WEEK) / 1000)}:R> to collect more.`,
          ),
      ],
    });
  },
};
