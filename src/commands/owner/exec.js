const { MessageEmbed } = require("discord.js");
const Command = require("../../structures/Command");
const { exec } = require("child_process");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "exec",
      aliases: ["execute"],
      description: "This is for the developers.",
      category: "Owner",
      usage: ["<thing-to-exec>"],
    });
  }

  async run(message, args) {
    if (!message.client.config.owners.includes(message.author.id)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.fail)
            .setDescription(
              `${message.client.emoji.fail} | You are not the owner of this bot.`,
            ),
        ],
      });
    }

    const input = args.join(" ").toLowerCase().trim();
    if (!input) {
      return message.channel.sendCustom("You have to give me some text to execute!");
    }

    // privacy blocks
    if (input.includes("config.json")) {
      return message.channel.sendCustom(
        "Due to privacy reasons, we can't show the config.json file.",
      );
    }

    if (input.includes(".env")) {
      return message.channel.sendCustom(
        "Due to privacy reasons, the .env file cannot be shown.",
      );
    }

    const allowed = ["ls", "pwd", "echo", "cat", "whoami", "date", "uptime"];
    const command = input.split(/\s+/)[0];

    if (!allowed.includes(command)) {
      return message.channel.sendCustom(
        "Due to security reasons, this command is not allowed.",
      );
    }

    exec(input, (error, stdout) => {
      const response = stdout || error?.message || "No output.";
      message.channel.sendCustom(`\`\`\`\n${response}\n\`\`\``);
    });
  }
};
