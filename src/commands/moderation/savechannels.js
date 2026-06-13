const Command = require("../../structures/Command");
const Logging = require("../../database/schemas/logging.js");
const { saveGuild } = require("channelsave-discord");

// Add any additional dependencies or modules as needed

module.exports = class EmptyCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "save", // Replace with your command name
      aliases: [], // Add any aliases for your command
      description: "Empty command template.",
      category: "Moderation", // Adjust the category as needed
      cooldown: 5,
      userPermission: ["ADMINISTRATOR"],
      botPermission: ["MANAGE_CHANNELS"],
    });
  }

  async run(message) {
    const logging = await Logging.findOne({ guildId: message.guild.id });

    if (logging && logging.moderation.delete_after_executed === "true") {
      message.delete().catch(() => {});
    }

    try {
      await saveGuild(
        message.guild,
        "/h/e/p/s/src/data/guild_information.json",
      );
      message.channel.sendCustom("done!").then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      });
    } catch (error) {
      console.error("Error in the empty command:", error);
      message.channel.sendCustom("An error occurred. Please try again later.");
    }
  }
};
