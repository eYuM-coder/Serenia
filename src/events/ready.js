const logger = require("../utils/logger"); // logger used for logs
const Event = require("../structures/Event"); /* Event file. This is used for the events
required for the bot to function correctly */
const Discord = require("discord.js");
const config = require("../../config.json");
const Guild = require("../database/schemas/Guild");
const { WebhookClient } = require("discord.js");
const premiumrip = new WebhookClient({ url: config.webhooks.premium }); // make sure webhook link is correct!!
const Message = require("../utils/other/message");

module.exports = class extends Event {
  async run() {
    Message(this.client);

    logger.info(
      `${this.client.user.tag} is ready to serve ${this.client.guilds.cache.size} guilds with ${this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} members.`,
      { label: "Ready" },
    );

    const startActivityRotator = () => {
      const { statuses, statusInterval } = this.client.config;

      const setActivity = () => {
        const entry = statuses[Math.floor(Math.random() * statuses.length)];
        const text = entry.name
          .replace("{guilds}", this.client.guilds.cache.size)
          .replace(
            "{users}",
            this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
          )
          .replace("{shards}", this.client.shardCount ?? 1);

        let activity;

        if (entry.type === "CUSTOM") {
          activity = {
            name: "Custom Status",
            state: text,
            type: Discord.ActivityType.Custom,
          };
        } else {
          // Map string types to Discord.js v14 ActivityType
          const activityTypeMap = {
            PLAYING: Discord.ActivityType.Playing,
            STREAMING: Discord.ActivityType.Streaming,
            LISTENING: Discord.ActivityType.Listening,
            WATCHING: Discord.ActivityType.Watching,
            COMPETING: Discord.ActivityType.Competing,
          };

          activity = {
            name: text,
            type: activityTypeMap[entry.type] || Discord.ActivityType.Playing,
          };
        }

        this.client.user.setPresence({
          status: Discord.PresenceUpdateStatus.Online,
          activities: [activity],
        });
      };

      setActivity();
      setInterval(setActivity, statusInterval);
    };

    startActivityRotator();

    setInterval(async () => {
      const conditional = {
        isPremium: "true",
      };
      const results = await Guild.find(conditional);

      if (results && results.length) {
        for (const result of results) {
          if (
            Number(result.premium.redeemedAt) >=
            Number(result.premium.expiresAt)
          ) {
            const guildPremium = this.client.guilds.cache.get(result.guildId);
            if (guildPremium) {
              const user = await this.client.users
                .fetch(result.premium.redeemedBy.id)
                .catch(() => null);

              if (user) {
                const embed = new Discord.EmbedBuilder()
                  .setColor(this.client.color.red)
                  .setDescription(
                    `Hey ${user.username}, Premium in ${guildPremium.name} has Just expired :(\n\n__You can you re-new your server here! [${process.env.AUTH_DOMAIN}/premium](${process.env.AUTH_DOMAIN}/premium)__\n\nThank you for purchasing premium Previously! We hope you enjoyed what you purchased.\n\n**- Serenia**`,
                  );

                user.send({ embeds: [embed] }).catch(() => {});
              }

              const rip = new Discord.EmbedBuilder()
                .setDescription(
                  `**Premium Subscription**\n\n**Guild:** ${
                    guildPremium.name
                  } | **${guildPremium.id}**\nRedeemed by: ${
                    user?.tag || "Unknown"
                  }\n**Plan:** ${result.premium.plan}`,
                )
                .setColor("Red")
                .setTimestamp();

              await premiumrip
                .send({
                  username: `${config.botName} Lose Premium`,
                  avatarURL: `${this.client.domain}/logo.png`,
                  embeds: [rip],
                })
                .catch(() => {});

              result.isPremium = "false";
              result.premium.redeemedBy.id = null;
              result.premium.redeemedBy.tag = null;
              result.premium.redeemedAt = null;
              result.premium.expiresAt = null;
              result.premium.plan = null;

              await result.save().catch(() => {});
            }
          }
        }
      }
    }, 86400000);

    if (config.dashboard === "true") {
      const Dashboard = require("../dashboard/dashboard");
      Dashboard(this.client);
    }
  }
};
