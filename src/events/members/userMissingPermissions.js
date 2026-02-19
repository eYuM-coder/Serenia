const Event = require("../../structures/Event");
const { MessageEmbed } = require("discord.js");
module.exports = class extends Event {
  async run(Permissions, message) {
    if (!message) return;
    const embed = new MessageEmbed()
      .setAuthor({
        name: `${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(`X Missing User Permissions`)
      .setDescription(
        `Required Permission: \`${Permissions.replace("_", " ")}\``
      )
      .setTimestamp()
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setColor(this.client.color.red);
    if (
      message.channel &&
      message.channel.viewable &&
      message.channel
        .permissionsFor(message.guild.members.me)
        .has(["SEND_MESSAGES", "EMBED_LINKS"])
    ) {
      message.channel.sendCustom({ embeds: [embed] }).catch(() => {});
    }
  }
};
