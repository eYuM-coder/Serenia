const Event = require("../../structures/Event");
const { PermissionFlagsBits, WebhookClient } = require("discord.js");
const config = require("../../../config.json");
const webhookClient = new WebhookClient({
  url: config.webhooks.errors,
});

module.exports = class extends Event {
  async run(error, message, cmd) {
    console.error(error);

    if (
      message.channel &&
      message.channel.viewable &&
      message.channel
        .permissionsFor(message.guild.members.me)
        .has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])
    ) {
      message.channel
        .sendCustom(
          `${message.client.emoji.fail} | Hey user! An error just occurred with the ${cmd} command, make sure to report it here! ${config.discord}`,
        )
        .catch(() => {});
    }

    webhookClient.sendCustom(
      `${message.author.username} (${message.author.id})\n${message.content}\n${error}`,
    );
  }
};
