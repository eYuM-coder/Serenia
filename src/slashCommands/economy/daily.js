const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { abbreviateNumber } = require("../../utils/parseAmount");
const { getProfile, updateProfile } = require("../../utils/economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect daily earnings. 24hr cooldown.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const DAY = 86400_000;
    const BASE_DAILY = 100000;
    const STREAK_MULTIPLIER = 1080;

    const profile = await getProfile({ userID: interaction.user.id });

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
    const lastDailyMs = profile.lastDaily
      ? new Date(profile.lastDaily).getTime()
      : 0;
    const timeSince = now - lastDailyMs;

    if (timeSince < DAY && lastDailyMs !== 0) {
      const timeLeft = Math.round((lastDailyMs + DAY - now) / 1000);
      const h = Math.floor(timeLeft / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60;

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setTitle(`${interaction.user.username}'s Daily cooldown`)
            .setDescription(
              `You have to wait **${h}h ${m}m ${s}s** before you can collect again!`,
            ),
        ],
        ephemeral: true,
      });
    }

    let streak = profile.dailyStreak || 0;
    let streakLost = 0;
    let daysMissed = 0;

    if (lastDailyMs !== 0) {
      daysMissed = Math.floor(timeSince / DAY);
      if (daysMissed >= 2) {
        streakLost = Math.min(daysMissed, streak);
        streak -= streakLost;
      } else {
        streak++;
      }
    } else {
      streak = 1;
    }

    const streakBonus = STREAK_MULTIPLIER * streak;
    const total = BASE_DAILY + streakBonus;

    const mainEmbed = new MessageEmbed()
      .setColor(interaction.client.color.green)
      .setTitle(`${interaction.user.username}'s Daily Coins`)
      .setDescription(
        `> $${abbreviateNumber(total)} was placed in your wallet!`,
      )
      .addFields(
        {
          name: "Base",
          value: `$${abbreviateNumber(BASE_DAILY)}`,
          inline: true,
        },
        {
          name: "Streak Bonus",
          value: `$${abbreviateNumber(streakBonus)}`,
          inline: true,
        },
        {
          name: "Next Daily",
          value: `<t:${Math.round((now + DAY) / 1000)}:R>`,
          inline: true,
        },
        { name: "Streak", value: `${abbreviateNumber(streak)}`, inline: true },
      );

    const embeds = [mainEmbed];

    if (streakLost > 0) {
      const streakLostEmbed = new MessageEmbed()
        .setColor("ORANGE")
        .setDescription(
          `You forgot to do your daily for **${daysMissed}** days, ${streakLost >= 1 && streak === 0 ? `so you lost your **${streakLost}**-day streak.` : `so your streak was decreased by **${streakLost}**.`} You last did your daily <t:${Math.round(lastDailyMs / 1000)}:R>`,
        );
      embeds.push(streakLostEmbed);
    }

    await updateProfile(
      { userID: interaction.user.id },
      {
        $set: { lastDaily: new Date(now), dailyStreak: streak },
        $inc: { wallet: total },
      },
    );

    await interaction.reply({ embeds });
  },
};
