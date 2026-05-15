const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const {
  parseAmount,
  isValidAmount,
  abbreviateNumber,
} = require("../../utils/parseAmount");
const { updateProfile, getProfile } = require("../../utils/economy");

const LARGE_TRANSFER_THRESHOLD = 5000;
const SUSPICIOUS_THRESHOLD = 10000;

const processingFeeEvents = [
  { weight: 30, rate: 0.0, label: null },
  {
    weight: 25,
    rate: 0.015,
    label: "**Platform processing fee (1.5%)** — we don't make the rules.",
  },
  {
    weight: 15,
    rate: 0.025,
    label:
      "**Weekend transfer surcharge (2.5%)** — banks charge more on weekends. We pass that on.",
  },
  {
    weight: 10,
    rate: 0.03,
    label:
      "**Expedited transfer fee (3%)** — you wanted it fast, you pay for fast.",
  },
  {
    weight: 8,
    rate: 0.05,
    label:
      "**Cross-network routing fee (5%)** — something about infrastructure costs.",
  },
  {
    weight: 5,
    rate: 0.08,
    label:
      "**High-value transfer fee (8%)** — the more you send, the more we take. That's finance.",
  },
  {
    weight: 4,
    rate: 0.1,
    label:
      "**Currency stability tax (10%)** — not real but it showed up anyway.",
  },
  {
    weight: 2,
    rate: 0.15,
    label:
      "**Regulatory compliance surcharge (15%)** — blame the government, not us.",
  },
  {
    weight: 1,
    rate: 0.2,
    label: "**Anti-money laundering processing fee (20%)** — ironic, we know.",
  },
];

const senderEvents = [
  { weight: 40, fn: () => ({ delta: 0, text: null }) },
  {
    weight: 12,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.05),
      text: `Your bank flagged the transaction as unusual and charged a **hold-release fee** on your end. **-$${Math.floor(amt * 0.05)}**`,
    }),
  },
  {
    weight: 8,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.02),
      text: `Your account has a monthly wire fee you forgot to cancel two years ago. It triggered today. **-$${Math.floor(amt * 0.02)}**`,
    }),
  },
  {
    weight: 6,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.08),
      text: `Transaction briefly overdrafted your linked backup account. Overdraft fee applied immediately. **-$${Math.floor(amt * 0.08)}**`,
    }),
  },
  {
    weight: 4,
    fn: (amt) => ({
      delta: Math.floor(amt * 0.03),
      text: `You had a cashback reward on transfers this billing period. It actually triggered. **+$${Math.floor(amt * 0.03)}**`,
    }),
  },
  {
    weight: 2,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.12),
      text: `IRS flagged this as a reportable gift transfer. A 12% gift tax estimate was withheld. File form 709 to maybe get it back someday. **-$${Math.floor(amt * 0.12)}**`,
    }),
  },
];

const recipientEvents = [
  { weight: 40, fn: () => ({ delta: 0, text: null }) },
  {
    weight: 12,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.03),
      text: `Recipient's bank charged an **incoming wire acceptance fee**. Not their fault. Not yours either. **-$${Math.floor(amt * 0.03)}** from received amount.`,
    }),
  },
  {
    weight: 8,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.05),
      text: `Recipient's account is in collections. Creditor seized a portion of the incoming transfer before it landed. **-$${Math.floor(amt * 0.05)}**`,
    }),
  },
  {
    weight: 5,
    fn: (amt) => ({
      delta: Math.floor(amt * 0.05),
      text: `Recipient had a referral bonus active on incoming transfers. They got a little extra. **+$${Math.floor(amt * 0.05)}**`,
    }),
  },
  {
    weight: 3,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.1),
      text: `Recipient's account was briefly frozen during processing. Bank released it but kept a 10% "dispute resolution hold." Pending. Forever probably. **-$${Math.floor(amt * 0.1)}**`,
    }),
  },
  {
    weight: 1,
    fn: (amt) => ({
      delta: -Math.floor(amt * 0.25),
      text: `Recipient's account flagged for verification. 25% of the transfer is in escrow pending review. ETA: 5-7 business days, probably never. **-$${Math.floor(amt * 0.25)}**`,
    }),
  },
];

const largeTransferEvents = [
  {
    text: `Transaction flagged by FinCEN monitoring. Both parties have been noted in the system. Nothing will happen. Probably.`,
  },
  {
    text: `Transfer exceeded the casual gifting threshold. A suspicious activity report was auto-filed with your financial institution. Have a nice day.`,
  },
  {
    text: `Bank compliance department automatically emailed both parties requesting "source of funds" documentation. You have 14 days to respond or the transfer reverses.`,
  },
  {
    text: `Transfer size triggered a mandatory 24-hour review window. Money moved. But someone, somewhere, made a note.`,
  },
];

function rollWeighted(events) {
  const total = events.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of events) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return events[events.length - 1];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay a user some money from your wallet.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to pay")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription(
          'Amount to pay (e.g. "1234", "all", "half", "25%", "1k")',
        )
        .setRequired(true),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const amountInput = interaction.options.getString("amount");
    const senderID = interaction.user.id;

    if (!user) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You must mention a user to pay."),
        ],
        ephemeral: true,
      });
    }

    if (user.id === senderID) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "You can't pay yourself. Believe me, someone has tried to find a loophole. There isn't one.",
            ),
        ],
        ephemeral: true,
      });
    }

    if (user.bot) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "You can't send money to a bot. They don't have wallets. Or needs. Or feelings about that.",
            ),
        ],
        ephemeral: true,
      });
    }

    const senderProfile = await getProfile({ userID: senderID });
    const recipientProfile = await getProfile({ userID: user.id });

    if (!senderProfile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You don't have a profile. Use `/register` first."),
        ],
        ephemeral: true,
      });
    }

    if (!recipientProfile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${user} doesn't have a profile. They should use \`/register\`.`,
            ),
        ],
        ephemeral: true,
      });
    }

    const rawAmount = parseAmount(amountInput, senderProfile.wallet);

    if (!isValidAmount(rawAmount, senderProfile.wallet)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              "Please enter a valid amount — a positive number, abbreviation, percentage, or `all`.",
            ),
        ],
        ephemeral: true,
      });
    }

    const feeEvent = rollWeighted(processingFeeEvents);
    const feeAmount = Math.floor(rawAmount * feeEvent.rate);
    const amountAfterFee = rawAmount - feeAmount;

    const senderEvent = rollWeighted(senderEvents);
    const senderResult = senderEvent.fn(rawAmount);

    const recipientEvent = rollWeighted(recipientEvents);
    const recipientResult = recipientEvent.fn(amountAfterFee);

    const senderTotal =
      rawAmount + feeAmount + Math.abs(Math.min(0, senderResult.delta));
    const recipientReceives = Math.max(
      0,
      amountAfterFee + recipientResult.delta,
    );

    if (senderTotal > senderProfile.wallet) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setTitle("Insufficient Funds")
            .setDescription(
              `You don't have enough to cover this transfer after fees.\n\n**Attempted:** $${abbreviateNumber(rawAmount)}\n**Fees:** $${abbreviateNumber(feeAmount)}\n**Your wallet:** $${abbreviateNumber(senderProfile.wallet)}\n\nFees are non-negotiable.`,
            ),
        ],
        ephemeral: true,
      });
    }

    const senderDeduct =
      rawAmount + feeAmount + Math.abs(Math.min(0, senderResult.delta));

    await updateProfile(
      { userID: senderID },
      { $inc: { wallet: -senderDeduct } },
    );
    await updateProfile(
      { userID: user.id },
      { $inc: { wallet: recipientReceives } },
    );

    const eventLines = [];

    if (feeEvent.label)
      eventLines.push(
        `💳 **Processing**\n${feeEvent.label} — **$${feeAmount}** deducted from transfer.`,
      );
    if (senderResult.text)
      eventLines.push(`🏦 **Your Bank**\n${senderResult.text}`);
    if (recipientResult.text)
      eventLines.push(`🏦 **Their Bank**\n${recipientResult.text}`);

    if (rawAmount >= SUSPICIOUS_THRESHOLD) {
      const flagEvent =
        largeTransferEvents[
          Math.floor(Math.random() * largeTransferEvents.length)
        ];
      eventLines.push(`🚨 **Compliance Alert**\n${flagEvent.text}`);
    } else if (rawAmount >= LARGE_TRANSFER_THRESHOLD && Math.random() < 0.4) {
      const flagEvent =
        largeTransferEvents[
          Math.floor(Math.random() * largeTransferEvents.length)
        ];
      eventLines.push(`⚠️ **Transfer Notice**\n${flagEvent.text}`);
    }

    const embedColor =
      recipientReceives < rawAmount * 0.7
        ? "#FF4444"
        : recipientReceives >= rawAmount
          ? "#00FF88"
          : interaction.client.color.green;

    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(embedColor)
          .setTitle(
            `💸 Transfer — ${interaction.user.username} → ${user.username}`,
          )
          .setDescription(
            eventLines.length
              ? eventLines.join("\n\n")
              : "Transfer processed without incident. Cherish this moment.",
          )
          .addFields(
            {
              name: "You Sent",
              value: `$${abbreviateNumber(rawAmount)}`,
              inline: true,
            },
            {
              name: "Fees & Deductions",
              value: `$${abbreviateNumber(senderDeduct - rawAmount)}`,
              inline: true,
            },
            {
              name: "They Received",
              value: `**$${abbreviateNumber(recipientReceives)}**`,
              inline: true,
            },
          ),
      ],
    });
  },
};
