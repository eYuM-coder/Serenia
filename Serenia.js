const {
  Client,
  Collection,
  Partials,
  GatewayIntentBits,
  ActivityType,
} = require("discord.js");
const Util = require("./src/structures/Util.js");
const config = require("./config.json");
const { getInfo } = require("discord-hybrid-sharding");
const { status } = config;

module.exports = class SereniaClient extends Client {
  constructor(options = {}) {
    super({
      ...(process.env.CLUSTER_MANAGER_NODE && {
        shards: getInfo().SHARD_LIST,
        shardCount: getInfo().TOTAL_SHARDS,
      }),

      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
      ],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
      ],
      allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: true,
      },
      presence: {
        status: "online",
        activities: [
          {
            type: ActivityType.Custom,
            name: status,
          },
        ],
      },
    });
    this.validate(options);
    this.botCommands = new Collection();
    this.slashCommands = new Collection();
    this.botEvents = new Collection();
    this.aliases = new Collection();
    this.utils = require("./src/utils/utils.js");
    this.mongoose = require("./src/utils/mongoose.js");
    this.utils = new Util(this);
    this.config = require("./config.json");
  }

  validate(options) {
    if (typeof options !== "object")
      throw new TypeError("Options should be a type of Object.");

    if (!options.prefix)
      throw new Error("You must pass a prefix for the client.");
    if (typeof options.prefix !== "string")
      throw new TypeError("Prefix should be a type of String.");
    this.prefix = options.prefix;
  }

  async start(token) {
    require("./src/utils/prototypes.js");
    await this.utils.loadCommands();
    await this.utils.loadEvents();
    await this.mongoose.init();
    this.login(token);
  }
};
