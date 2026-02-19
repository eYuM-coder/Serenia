const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { abbreviateNumber, parseAmount } = require("../../utils/parseAmount");
const nerdamer = require("nerdamer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect daily earnings. 24hr cooldown.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const DAY = 86400_000;
    const BASE_DAILY = 100000;
    const profile = await Profile.findOne({
      userID: interaction.user.id,
    });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.yellow)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`,
            ),
        ],
        ephemeral: true,
      });
    } else {
      if (!profile.lastDaily) {
        await Profile.updateOne(
          {
            userID: interaction.user.id,
          },
          { $set: { lastDaily: Date.now() } },
        );
        await Profile.updateOne({
          userID: interaction.user.id,
        });
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle(`${interaction.user.username}'s Daily`)
              .setDescription(
                `You have collected todays earnings ($50000).\nCome back tomorrow to collect more.`,
              ),
          ],
        });
      } else if (Date.now() - profile.lastDaily > DAY) {
        const now = Date.now();
        const timeSince = now - profile.lastDaily;

        let streak = nerdamer(profile.dailyStreak).text();

        const daysMissed = Math.floor(timeSince / DAY) - 1;

        let streakLost = 0;

        if (daysMissed > 0) {
          if (daysMissed >= streak) {
            streakLost = streak;
            streak = 0;
          } else {
            streakLost = daysMissed;
            streak = streak - daysMissed;
          }
        } else {
          streak++;
        }

        const streakBonus = 1080 * streak;
        const total = BASE_DAILY + streakBonus;
        const embed = new MessageEmbed()
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
              value: `<t:${Math.round((now + 86400000) / 1000)}:R>`,
              inline: true,
            },
            {
              name: "Streak",
              value: `${abbreviateNumber(streak)}`,
              inline: true,
            },
          );
        const streakLostEmbed = new MessageEmbed()
          .setColor("DEFAULT")
          .setDescription(
            `You forgot to do your daily for **${daysMissed}** days, ${streakLost >= 1 && streak === 0 ? `so you lost your **${streakLost}**-day streak.` : `so your streak was decreased by **${streakLost}**.`} You last did your daily <t:${profile.lastDaily}:R>`,
          );

        await Profile.updateOne(
          { userID: interaction.user.id },
          {
            $set: { lastDaily: Date.now(), dailyStreak: streak },
            $inc: { wallet: total },
          },
        );
        if (streakLost > 0) {
          await interaction.reply({
            embeds: [embed, streakLostEmbed],
          });
        } else {
          await interaction.reply({
            embeds: [embed],
          });
        }
      } else {
        const lastDaily = new Date(profile.lastDaily);
        const timeLeft = Math.round(
          (lastDaily.getTime() + 86400000 - Date.now()) / 1000,
        );
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft - hours * 3600) / 60);
        const seconds = timeLeft - hours * 3600 - minutes * 60;
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setTitle(`${interaction.user.username}'s Daily cooldown`)
              .setDescription(
                `You have to wait ${hours}h ${minutes}m ${seconds}s before you can collect your daily earnings!`,
              ),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
