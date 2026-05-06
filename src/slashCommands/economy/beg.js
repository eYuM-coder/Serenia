const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getProfile, updateProfile } = require("../../utils/economy");
const { abbreviateNumber } = require("../../utils/parseAmount");

const BEG_COOLDOWN = 180000;

const begLocations = [
  "outside a Whole Foods",
  "near a bank ATM",
  "in front of a Starbucks",
  "at a busy intersection",
  "outside a mall entrance",
  "by a subway station",
  "in a Walmart parking lot",
  "near a college campus",
  "on a park bench",
  "outside a hospital",
  "at a gas station",
  "on a highway off-ramp",
  "near a courthouse",
  "outside a casino",
  "at the airport arrivals lane",
];

const begOutcomes = [
  {
    weight: 8,
    fn: () => ({
      amount: 0,
      title: "Nobody.",
      text: "You sat there for twenty minutes. People looked at their phones harder when they walked past you. One woman crossed the street early just to avoid the conversation.",
    }),
  },
  {
    weight: 7,
    fn: () => ({
      amount: 0,
      title: "Lectured.",
      text: 'A man in a North Face vest stopped to tell you about "personal responsibility" and the "dignity of work." He was very thorough. He did not give you anything. He gave you a card for a staffing agency.',
    }),
  },
  {
    weight: 6,
    fn: () => ({
      amount: 0,
      title: "Offered a Job Instead.",
      text: 'A restaurant manager came outside and offered you a position washing dishes. You said you\'d "think about it." You are still thinking about it. No money changed hands.',
    }),
  },
  {
    weight: 6,
    fn: () => ({
      amount: 0,
      title: "Moved Along.",
      text: "A security guard asked you to leave private property. You moved half a block. Then a cop asked you to move again. You have now walked further than you intended today.",
    }),
  },
  {
    weight: 5,
    fn: () => ({
      amount: 0,
      title: "Someone Gave You Food.",
      text: "A woman handed you a granola bar and said 'God bless.' You are not hungry. You ate it anyway out of politeness. You have $0 more than when you started.",
    }),
  },
  {
    weight: 5,
    fn: () => ({
      amount: 0,
      title: "Photographed.",
      text: "Someone took a photo of you for what you can only assume is a social media post about 'the state of things.' They did not offer money. They did look very moved.",
    }),
  },
  {
    weight: 4,
    fn: () => ({
      amount: 0,
      title: "Someone Called a Nonprofit.",
      text: "A well-meaning person phoned an outreach organization on your behalf. Two volunteers showed up 45 minutes later with pamphlets. The pamphlets were extensive.",
    }),
  },
  {
    weight: 4,
    fn: (wallet) => ({
      amount: -Math.floor(wallet * 0.04 + 5),
      title: "Pickpocketed While Begging.",
      text: "Someone stopped to pretend to put money in your hand. Their partner took your phone while you were distracted. You didn't notice until they were gone. **Lost money.**",
    }),
  },
  {
    weight: 3,
    fn: (wallet) => ({
      amount: -Math.floor(wallet * 0.02 + 3),
      title: "Citation Issued.",
      text: "Officer issued you a citation for 'solicitation without a permit.' You didn't know that was a thing. It is a thing. The fine is payable online or in person. **Lost money.**",
    }),
  },
  {
    weight: 18,
    fn: () => ({
      amount: Math.floor(Math.random() * 8 + 1),
      title: "Loose Change.",
      text: "A few people tossed coins without looking at you. One guy gave you a button by accident. You have coins. It's something.",
    }),
  },
  {
    weight: 14,
    fn: () => ({
      amount: Math.floor(Math.random() * 15 + 5),
      title: "A Dollar Here and There.",
      text: "Some people gave. Most didn't. A teenager gave you their last $5 and felt really good about it. You appreciated it more than they'll ever know.",
    }),
  },
  {
    weight: 8,
    fn: () => ({
      amount: Math.floor(Math.random() * 25 + 15),
      title: "Decent Haul.",
      text: "It was a good corner on a good day. A woman gave you a $20 and said 'get yourself something warm.' You will. Or you won't. Either way you have cash now.",
    }),
  },
  {
    weight: 5,
    fn: () => ({
      amount: Math.floor(Math.random() * 60 + 40),
      title: "Unexpectedly Good Day.",
      text: "A guy who 'used to be where you are' stopped and gave you $50 cash without making it weird. He just said 'been there' and kept walking. Solid human.",
    }),
  },
  {
    weight: 3,
    fn: () => ({
      amount: Math.floor(Math.random() * 80 + 70),
      title: "The Guilt Money.",
      text: "A businessman in a tailored suit had clearly been having an existential crisis. He handed you $100, said nothing, and got into a waiting car. You were a prop in his character arc. Take the money.",
    }),
  },
  {
    weight: 2,
    fn: () => ({
      amount: Math.floor(Math.random() * 150 + 120),
      title: "Church Group Pity.",
      text: "A youth group on a service project spotted you and pooled their lunch money to give to 'someone in need.' Their chaperone matched it. You received $150 and a pamphlet about salvation.",
    }),
  },
  {
    weight: 1,
    fn: () => ({
      amount: Math.floor(Math.random() * 400 + 300),
      title: "A Genuinely Wealthy Person Felt Bad.",
      text: "A woman who clearly hasn't checked a price tag in years sat next to you on a bench, asked your name, and listened for 10 minutes. Then she gave you cash from an envelope in her purse like it was a tip. You don't know how much is in there. Apparently a lot.",
    }),
  },
  {
    weight: 1,
    fn: () => ({
      amount: Math.floor(Math.random() * 800 + 600),
      title: "Social Media Moment.",
      text: "Someone filmed your interaction with a passerby, posted it, and it got 400k views in two hours. A journalist tracked you down. Three people sent you money via strangers. You don't fully understand what happened.",
    }),
  },
  {
    weight: 0.5,
    fn: () => ({
      amount: Math.floor(Math.random() * 1200 + 1000),
      title: "🎰 THE PITY JACKPOT",
      text: "A lottery winner drove by in a new car, rolled the window down, and said 'I remember being broke' before handing you a folded stack of bills. They drove off before you could count it. You counted it. It was a lot.",
    }),
  },
  {
    weight: 0.2,
    fn: () => ({
      amount: Math.floor(Math.random() * 1500 + 1800),
      title: "💀 THE ONE IN A MILLION",
      text: "A documentary crew was filming a segment on economic inequality. You were featured for 4 minutes. A production company viewer sent a $2,000 wire to the show to give to you directly. They forwarded it. The show took 15% as an 'administrative fee.' You still came out ahead.",
    }),
  },
  {
    weight: 4,
    fn: () => ({
      amount: 0,
      title: "Offered a Bible.",
      text: "You received a Bible. A very nice one actually, hardcover. Worth nothing monetarily. You now own a Bible.",
    }),
  },
  {
    weight: 3,
    fn: (wallet) => ({
      amount: -Math.floor(wallet * 0.01 + 2),
      title: "Someone Stole Your Sign.",
      text: "A guy grabbed your cardboard sign as a bit. His friends laughed. You had to remake it. The marker cost money. **Lost money.**",
    }),
  },
  {
    weight: 2,
    fn: () => ({
      amount: Math.floor(Math.random() * 10 + 5),
      title: "Spare Change from a Kid.",
      text: "A little kid saw you, walked back to their parent, argued for thirty seconds, then came over and gave you their allowance. The parent looked annoyed. You felt many things.",
    }),
  },
  {
    weight: 2,
    fn: () => ({
      amount: 0,
      title: "Given Advice Instead.",
      text: 'A man gave you a 12-minute breakdown on how you can make $5,000 a month through his dropshipping course. It\'s only $299 to start. "An investment in yourself." He left his Instagram handle.',
    }),
  },
  {
    weight: 1,
    fn: () => ({
      amount: Math.floor(Math.random() * 35 + 25),
      title: "Foreign Currency.",
      text: "Someone gave you money that is definitely not USD. It's colorful. You looked it up. The exchange rate is actually decent if you can find someone to convert it. You found someone. **Net gain.**",
    }),
  },
];

function rollOutcome(wallet) {
  const total = begOutcomes.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of begOutcomes) {
    r -= e.weight;
    if (r <= 0) return e.fn(wallet);
  }
  return begOutcomes[begOutcomes.length - 1].fn(wallet);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription(
      "Sit down somewhere and beg. Results may vary. Dignity will not.",
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const profile = await getProfile({ userID: interaction.user.id });

    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You don't have a profile. Use `/register` first."),
        ],
        ephemeral: true,
      });
    }

    const now = Date.now();
    const lastBeg = profile.lastBeg || 0;
    const remaining = BEG_COOLDOWN - (now - lastBeg);

    if (remaining > 0) {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const waitMessages = [
        `You can't beg again yet. You're still processing the last rejection.`,
        `People remember you from last time. Give them ${minutes}m ${seconds}s to forget your face.`,
        `You were just here. You need to let the foot traffic refresh. ${minutes}m ${seconds}s.`,
        `Begging too frequently affects your take. Let the crowd cycle. ${minutes}m ${seconds}s.`,
        `The security guard is still watching. Wait ${minutes}m ${seconds}s before going back out there.`,
      ];

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setTitle(`${interaction.user.username}'s Beg Cooldown`)
            .setDescription(
              waitMessages[Math.floor(Math.random() * waitMessages.length)] +
                `\n\n**Time remaining: ${minutes}m ${seconds}s**`,
            ),
        ],
        ephemeral: true,
      });
    }

    const location =
      begLocations[Math.floor(Math.random() * begLocations.length)];
    const outcome = rollOutcome(profile.wallet || 0);

    const amountChange = outcome.amount || 0;
    const finalWalletChange = amountChange;
    const walletBalance = profile.wallet;
    const walletAfter = walletBalance + finalWalletChange;

    await updateProfile(
      { userID: interaction.user.id },
      {
        $set: { lastBeg: now },
        $inc: { wallet: finalWalletChange },
      },
    );

    const isLoss = amountChange < 0;
    const isZero = amountChange === 0;
    const isBig = amountChange >= 300;

    const embedColor = isBig
      ? "#FFD700"
      : isLoss
        ? "#8B0000"
        : isZero
          ? "#555555"
          : interaction.client.color.green;

    const amountText = isLoss
      ? `**-$${Math.abs(amountChange)}**`
      : amountChange > 0
        ? `**+$${amountChange}**`
        : `**$0**`;

    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(embedColor)
          .setTitle(`${interaction.user.username} begged ${location}`)
          .setDescription(`**${outcome.title}**\n\n${outcome.text}`)
          .addFields(
            { name: "Net Change", value: amountText, inline: true },
            {
              name: "Wallet After",
              value: `$${abbreviateNumber(walletAfter)}`,
              inline: true,
            },
          ),
      ],
    });
  },
};
