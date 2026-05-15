const Event = require("../../structures/Event");
const Discord = require("discord.js");
const logger = require("../../utils/logger");
const Guild = require("../../database/schemas/Guild");
const Logging = require("../../database/schemas/logging");
const config = require("../../../config.json");
const webhookClient = new Discord.WebhookClient({
  url: config.webhooks.joinsPublic,
});
const welcomeClient = new Discord.WebhookClient({
  url: config.webhooks.joinsPrivate,
});

module.exports = class extends Event {
  async run(guild) {
    logger.info(`Joined to "${guild.name}" (${guild.id})`, { label: "Guilds" });

    const find = await Guild.findOne({
      guildId: guild.id,
    });

    if (!find) {
      const guildConfig = await Guild.create({
        guildId: guild.id,
        language: "english",
      });
      await guildConfig.save().catch(() => {});
    }

    var textChats = guild.channels.cache.find(
      (ch) =>
        ch.type === Discord.ChannelType.GuildText &&
        ch
          .permissionsFor(guild.members.me)
          .has([
            Discord.PermissionFlagsBits.SendMessages,
            Discord.PermissionFlagsBits.ViewChannel,
            Discord.PermissionFlagsBits.EmbedLinks,
          ]),
    );

    const modLog = guild.channels.cache.find(
      (c) =>
        c.name.replace("-", "").replace("s", "") === "modlog" ||
        c.name.replace("-", "").replace("s", "") === "moderatorlog",
    );

    let muteRole = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "muted",
    );
    if (!muteRole) {
      try {
        muteRole = await guild.roles.create({
          data: {
            name: "Muted",
            permissions: [],
          },
        });
      } catch (e) {}
      for (const channel of guild.channels.cache.values()) {
        try {
          if (
            channel.viewable &&
            channel
              .permissionsFor(guild.members.me)
              .has(Discord.PermissionFlagsBits.ManageChannels)
          ) {
            if (channel.type === Discord.ChannelType.GuildText)
              await channel.permissionOverwrites.edit(muteRole, {
                SendMessages: false,
                AddReactions: false,
              });
            else if (
              channel.type === Discord.ChannelType.GuildVoice &&
              channel.editable
            )
              await channel.permissionOverwrites.edit(muteRole, {
                Speak: false,
                Stream: false,
              });
          }
        } catch (e) {}
      }
    }

    const logging = await Logging.findOne({
      guildId: guild.id,
    });
    if (!logging) {
      const newL = await Logging.create({
        guildId: guild.id,
      });
      await newL.save().catch(() => {});
    }

    const logging2 = await Logging.findOne({
      guildId: guild.id,
    });

    if (logging2) {
      if (muteRole) {
        logging2.moderation.mute_role = muteRole.id;
      }

      if (modLog) {
        logging2.moderation.channel = modLog.id;
      }
      await logging2.save().catch(() => {});
    }

    if (textChats) {
      const embed = new Discord.EmbedBuilder()
        .setColor("Purple")
        .setDescription(
          `Hey there! I'm **${config.botName}**.\n\nThank you for inviting me to your server, it means a lot to us! You can get started with [\`!help\`](${process.env.AUTH_DOMAIN}) & customize your server settings by accessing the dashboard [\`here\`](${process.env.AUTH_DOMAIN}/dashboard/${guiild.id}).\n\n__**Current News**__\n\`\`\`\nWe are currently giving premium to all servers until 1000 guilds! If interested, please visit [this site](${process.env.AUTH_DOMAIN}/redeem).\`\`\`\n\nAgain, thank you for inviting me! (This server is now very pog)\n**- ${config.botName}**`,
        )
        .addFields({
          name: "\u200b",
          value:
            "**[Invite](https://serenia.eyum.dev/invite) | " +
            `[Support Server](${process.env.AUTH_DOMAIN}/support) | ` +
            `[Dashboard](${process.env.AUTH_DOMAIN}/dashboard)**`,
        });

      textChats.send({ embeds: [embed] }).catch(() => {});
    }

    const welcomeEmbed = new Discord.EmbedBuilder()
      .setColor(this.client.color.green)
      .setTitle("New Server")
      .setThumbnail(`${process.env.AUTH_DOMAIN}/logo.png`)
      .setDescription(`${config.botName} was added to a new server!`)
      .addFields(
        { name: `Server Name`, value: `\`${guild.name}\``, inline: true },
        { name: `Server ID`, value: `\`${guild.id}\``, inline: true },
      )
      .setFooter({
        text: `${this.client.guilds.cache.size} guilds`,
        iconURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      });

    welcomeClient.sendCustom({
      username: `${config.botName}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [welcomeEmbed],
    });

    const embed = new Discord.EmbedBuilder()
      .setColor(this.client.color.green)
      .setDescription(
        `I have joined the ${guild.name} server.\n\nID: ${guild.id}`,
      )
      .setFooter({
        text: `Gained ${guild.members.cache.size - 1} members • I'm now in ${this.client.guilds.cache.size} servers.`,
      })
      .setThumbnail(
        guild.iconURL({ dynamic: true })
          ? guild.iconURL({ dynamic: true })
          : `https://guild-default-icon.herokuapp.com/${encodeURIComponent(guild.name)}`,
      );

    webhookClient.sendCustom({
      username: `${this.client.user.username}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [embed],
    });
  }
};
