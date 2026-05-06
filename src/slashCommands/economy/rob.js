const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { updateProfile, getProfile } = require("../../utils/economy");

function abbreviateNumber(number) {
  return number >= 1e12
    ? `${(number / 1e12).toFixed(2)}T`
    : number >= 1e9
      ? `${(number / 1e9).toFixed(2)}B`
      : number >= 1e6
        ? `${(number / 1e6).toFixed(2)}M`
        : number >= 1e3
          ? `${(number / 1e3).toFixed(2)}K`
          : number.toString();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob someone!")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to rob."),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const targetProfile = await getProfile({ userID: user.id });
    if (!targetProfile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `This user currently does not have a profile registered!\nUse the /register command to register your profile.`,
            ),
        ],
      });
    }

    if (user.id === interaction.user.id) {
      return interaction.reply({
        embeds: [
          new MessageEmbed().setDescription(
            `hey stupid, seems pretty dumb to steal from urself`,
          ),
        ],
      });
    }

    const robber = await getProfile({ userID: interaction.user.id });

    if (!robber) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "You need to register first. Use `/register` to do so.",
            ),
        ],
        ephemeral: true,
      });
    }

    if (targetProfile.wallet <= 5000) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "This user does not have enough money in their wallet. They need $5000 in order to be robbed (this is due to the new padlock system)",
            ),
        ],
      });
    }

    if (targetProfile.padlock?.isActive && targetProfile.padlock.usesLeft > 0) {
      await updateProfile(
        { userID: user.id },
        {
          $inc: {
            "padlock.usesLeft": -1,
            wallet: 5000,
          },
        },
      );

      try {
        await user.send(
          `🔒 Someone tried to rob you, but your padlock blocked it!`,
        );
      } catch (e) {}

      await updateProfile(
        { userID: interaction.user.id },
        {
          $set: { lastRobbed: Date.now() },
          $inc: { wallet: -5000 },
        },
      );

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${user} had a padlock on their wallet, so you couldn't rob them. You ended up getting caught and had to pay them $5000.`,
            ),
        ],
      });
    }

    const fail = Math.random() < 0.35;

    await updateProfile(
      { userID: interaction.user.id },
      { $set: { lastRobbed: Date.now() } },
    );

    if (fail) {
      const penalty = Math.floor(targetProfile.wallet * 0.1);

      await updateProfile(
        { userID: interaction.user.id },
        { $inc: { wallet: -penalty } },
      );

      await updateProfile({ userID: user.id }, { $inc: { wallet: penalty } });

      await user
        .send(
          `⚠️ ${interaction.user} tried to rob you. They ended up failing, so they paid you $${abbreviateNumber(penalty)}.`,
        )
        .catch(() => {});

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You tried to rob ${user}, but you were CAUGHT and ended up paying them $${abbreviateNumber(penalty)}.`,
            ),
        ],
      });
    }

    if (Date.now() - robber.lastRobbed > 600000) {
      let amount = Math.floor(Math.random() * targetProfile.wallet);
      await updateProfile(
        {
          userID: user.id,
        },
        { $inc: { wallet: -amount } },
      );
      await updateProfile(
        {
          userID: interaction.user.id,
        },
        {
          $set: { lastRobbed: Date.now() },
          $inc: { wallet: amount },
        },
      );

      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setDescription(
              `Successfully robbed ${user} for $${abbreviateNumber(amount)}.`,
            )
            .setColor(interaction.client.color.green)
            .setTimestamp(),
        ],
      });
    } else {
      const lastRobbed = new Date(robber.lastRobbed);
      const timeLeft = Math.round(
        (lastRobbed.getTime() + 600000 - Date.now()) / 1000,
      );
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft - minutes * 60;
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You have to wait ${minutes}m ${seconds}s before you can rob someone!`,
            ),
        ],
      });
    }
  },
};
