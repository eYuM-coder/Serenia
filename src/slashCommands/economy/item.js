const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { shopItems } = require("../../utils/shopItems.js");
const { abbreviateNumber } = require("../../utils/parseAmount");
const { getProfile, updateProfile } = require("../../utils/economy.js");
const nerdamer = require("nerdamer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("item")
    .setDescription("Manage your items (buy, use, whatever)")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Buy an item from the shop")
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("The item you want to buy")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("How many do you want?")
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("use")
        .setDescription("Use an item you own")
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("What to use")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("How many do you want to use?")
            .setMinValue(1),
        ),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const focusedValue = focused.value.toLowerCase();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "buy") {
      const choices = shopItems
        .filter((item) => item.name.toLowerCase().includes(focusedValue))
        .map((item) => ({
          name: `${item.name} - $${item.price}`,
          value: item.id,
        }));
      return interaction.respond(choices.slice(0, 25));
    }

    if (subcommand === "use") {
      const profile = await getProfile({ userID: interaction.user.id });
      if (!profile || !profile.inventory) return interaction.respond([]);

      const choices = profile.inventory
        .filter((inv) => {
          const item = shopItems.find((i) => i.name === inv.name);
          return (
            item &&
            item.name.toLowerCase().includes(focusedValue) &&
            inv.amount > 0
          );
        })
        .map((inv) => {
          const item = shopItems.find((i) => i.name === inv.name);
          return {
            name: `${item.name} (Owned: ${inv.amount})`,
            value: item.id,
          };
        });
      return interaction.respond(choices.slice(0, 25));
    }
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const itemID = interaction.options.getString("item");
    const item = shopItems.find((i) => i.id === itemID);

    if (!item)
      return interaction.reply({
        content: "That item doesn't exist!",
        ephemeral: true,
      });

    let profile = await getProfile({ userID: interaction.user.id });

    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`,
            ),
        ],
        ephemeral: true,
      });
    }

    if (subcommand === "buy") {
      const quantity = interaction.options.getInteger("amount") || 1;
      const totalPrice = item.price * quantity;
      const walletBalance = profile.wallet;

      if (walletBalance < totalPrice) {
        return interaction.reply({
          content: `You need $${abbreviateNumber(totalPrice - walletBalance)} more to buy ${quantity} ${item.name}${quantity > 1 ? "s" : ""}`,
          ephemeral: true,
        });
      }

      const hasItem = profile.inventory.find((i) => i.name === item.name);

      if (hasItem) {
        await updateProfile(
          { userID: interaction.user.id, "inventory.name": item.name },
          {
            $inc: {
              "inventory.$.amount": quantity,
              wallet: -totalPrice,
            },
          },
        );
      } else {
        await updateProfile(
          { userID: interaction.user.id },
          {
            $push: { inventory: { name: item.name, amount: quantity } },
            $inc: { wallet: -totalPrice },
          },
        );
      }

      // FIX: profile.wallet is stale after updateProfile, so calculate the
      // remaining balance manually instead of reading the old value.
      const balanceAfter = walletBalance - totalPrice;

      const purchaseEmbed = new MessageEmbed()
        .setTitle("Successful Purchase")
        .setDescription(`> You have $${abbreviateNumber(balanceAfter)} left.`)
        .addFields(
          { name: "You bought:", value: `- ${quantity} ${item.name}` },
          { name: "You paid:", value: `- $${abbreviateNumber(totalPrice)}` },
        )
        .setColor(interaction.client.color.green);
      return interaction.reply({ embeds: [purchaseEmbed] });
    }

    if (subcommand === "use") {
      const quantity = interaction.options.getInteger("amount") || 1;
      const invItem = profile.inventory.find((i) => i.name === item.name);

      if (!invItem || invItem.amount <= 0)
        return interaction.reply({
          content: "You don't own this!",
          ephemeral: true,
        });

      if (quantity > invItem.amount) {
        return interaction.reply({
          content: `You do not own ${quantity} ${item.name}${quantity > 1 ? "s" : ""}! You only have ${invItem.amount} ${item.name}${invItem.amount > 1 ? "s" : ""}!`,
          ephemeral: true,
        });
      }

      if (item.id === "bank_note") {
        let totalBoost = 0;

        for (let i = 0; i < quantity; i++) {
          totalBoost += Math.floor(Math.random() * 100000);
        }

        await updateProfile(
          {
            userID: interaction.user.id,
            "inventory.name": item.name,
          },
          {
            $inc: {
              bankCapacity: totalBoost,
              "inventory.$.amount": -quantity,
            },
          },
        );

        const newBankSpace = nerdamer(`${profile.bankCapacity} + ${totalBoost}`)
          .evaluate()
          .text();

        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .addFields(
                { name: "Used", value: `${quantity} Bank Note` },
                {
                  name: "Added Bank Space",
                  value: `$${abbreviateNumber(totalBoost)}`,
                },
                {
                  name: "Total Bank Space",
                  value: `$${abbreviateNumber(newBankSpace)}`,
                },
              )
              .setFooter({
                text: `${invItem.amount - quantity} bank note${invItem.amount - quantity !== 1 ? "s" : ""} left`,
              }),
          ],
        });
      }

      if (item.id === "padlock") {
        if (profile.padlock.isActive) {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setDescription(
                  `You already have a padlock active! You have ${profile.padlock.usesLeft} use${profile.padlock.usesLeft > 1 ? "s" : ""} of your padlock remaining.`,
                ),
            ],
          });
        }

        await updateProfile(
          { userID: interaction.user.id, "inventory.name": item.name },
          {
            $inc: { "inventory.$.amount": -1 },
            $set: {
              "padlock.isActive": true,
              "padlock.usesLeft": 3,
            },
          },
        );

        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setDescription(
                "Padlock has been equipped for your wallet! You have 3 uses remaining.",
              ),
          ],
        });
      }
    }
  },
};
