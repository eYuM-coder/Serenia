const Guild = require("../database/schemas/Guild");

module.exports = async (message) => {
  const settings = await Guild.findOne({
    guildId: message.guild.id,
  }).catch((err) => console.error(err));

  if (settings.antiLinks) {
    if (
      !message.member.permissions.has(
        "Administrator" ||
          "ManageGuild" ||
          "BanMembers" ||
          "KickMembers" ||
          "ManageMessages",
      )
    ) {
      if (hasLink(message.content)) {
        return deleteLink(message);
      }
    }
  } else return;

  function hasLink(string) {
    let link =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#%?=~_|!:,.;]*[-A-Z0-9+&@#%=~_|])/gi;

    if (link.test(string)) return true;
    return false;
  }

  function deleteLink(message) {
    if (message.deletable) {
      message.delete().catch(() => {});
    }

    message.channel.sendCustom({
      embed: {
        color: "RED",
        author: {
          name: `${message.member.user.tag}`,
          icon_url: message.member.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          }),
        },
        footer: {
          text: message.deletable
            ? ""
            : "Couldn't delete the message due to missing Permissions.",
        },
        description: "No Links allowed here",
      },
    });
    return true;
  }
};
