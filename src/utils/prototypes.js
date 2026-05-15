const {
  EmbedBuilder,
  TextChannel,
  VoiceChannel,
  ThreadChannel,
  WebhookClient,
} = require("discord.js");

TextChannel.prototype.sendCustom = function (content) {
  try {
    if (typeof content === "object" && content instanceof EmbedBuilder) {
      if (content.embed) {
        return this.send({ embeds: [content.embed] });
      } else {
        return this.send({ embeds: [content] });
      }
    } else {
      if (!(content instanceof EmbedBuilder) && content.embed) {
        return this.send({ embeds: [content.embed] });
      }
    }
    if (typeof content === "string") {
      return this.send({ content });
    }
    return this.send(content);
  } catch (error) {
    console.log(error);
  }
};

VoiceChannel.prototype.sendCustom = function (content) {
  try {
    if (typeof content === "object" && content instanceof EmbedBuilder) {
      if (content.embed) {
        return this.send({ embeds: [content.embed] });
      } else {
        return this.send({ embeds: [content] });
      }
    } else {
      if (!(content instanceof EmbedBuilder) && content.embed) {
        return this.send({ embeds: [content.embed] });
      }
    }
    if (typeof content === "string") {
      return this.send({ content });
    }
    return this.send(content);
  } catch (error) {
    console.log(error);
  }
};

ThreadChannel.prototype.sendCustom = function (content) {
  try {
    if (typeof content === "object" && content instanceof EmbedBuilder) {
      if (content.embed) {
        return this.send({ embeds: [content.embed] });
      } else {
        return this.send({ embeds: [content] });
      }
    } else {
      if (!(content instanceof EmbedBuilder) && content.embed) {
        return this.send({ embeds: [content.embed] });
      }
    }
    if (typeof content === "string") {
      return this.send({ content });
    }
    return this.send(content);
  } catch (error) {
    console.log(error);
  }
};

WebhookClient.prototype.sendCustom = function (content) {
  try {
    if (typeof content === "object" && content instanceof EmbedBuilder) {
      if (content.embed) {
        return this.send({ embeds: [content.embed] });
      } else {
        return this.send({ embeds: [content] });
      }
    } else {
      if (!(content instanceof EmbedBuilder) && content.embed) {
        return this.send({ embeds: [content.embed] });
      }
    }
    if (typeof content === "string") {
      return this.send({ content });
    }
    return this.send(content);
  } catch (error) {
    console.log(error);
  }
};
