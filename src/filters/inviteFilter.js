const Guild = require("../database/schemas/Guild");
const fetch = require("node-fetch");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = async (message) => {
  const settings = await Guild.findOne({
    guildId: message.guild.id,
  });

  // If antiLinks is enabled, ignore invite checking (as per original logic)
  if (settings.antiLinks) return;

  if (settings.antiInvites) {
    // Fix permission check: use PermissionsBitField.Flags and check each
    const hasPerm = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator ||
        PermissionsBitField.Flags.ManageGuild ||
        PermissionsBitField.Flags.BanMembers ||
        PermissionsBitField.Flags.KickMembers ||
        PermissionsBitField.Flags.ManageMessages,
    );

    if (!hasPerm) {
      const inviteRegex =
        /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/gi;

      if (inviteRegex.test(message.content)) {
        // Extract invite code
        const msgcontent = message.content;
        const code = msgcontent.replace(
          /(https:\/\/)?(www\.)?(discord\.gg|discord\.me|discordapp\.com\/invite|discord\.com\/invite)\/?/gi,
          "",
        );

        try {
          const res = await fetch(`https://discordapp.com/api/invite/${code}`);
          const json = await res.json();

          if (json.message !== "Unknown Invite") {
            await message.delete().catch(() => {});

            const embed = new EmbedBuilder()
              .setColor(0xff0000) // Red
              .setAuthor({
                name: message.member.user.tag,
                iconURL: message.member.user.displayAvatarURL({ size: 1024 }),
              })
              .setFooter({
                text: message.deletable
                  ? ""
                  : "Couldn't delete the message due to missing Permissions.",
              })
              .setDescription("No invite links here");

            await message.channel.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (error) {
          // Handle fetch errors silently
        }
      } else {
        // Check for any discord invite link variant
        const linkMatch = message.content.match(
          /(https?:\/\/)?(www\.)?(discord\.gg|discord\.me|discordapp\.com\/invite|discord\.com\/invite)\/([a-z0-9-.]+)?/i,
        );

        if (linkMatch) {
          await message.delete().catch(() => {});

          const embed = new EmbedBuilder()
            .setColor("Red")
            .setAuthor({
              name: message.member.user.tag,
              iconURL: message.member.user.displayAvatarURL({ size: 1024 }),
            })
            .setFooter({
              text: message.deletable
                ? ""
                : "Couldn't delete the message due to missing Permissions.",
            })
            .setDescription("No invite links here");

          await message.channel.sendCustom({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  }
};
