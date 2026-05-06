const { SlashCommandBuilder } = require("@discordjs/builders");
const nerdamer = require("nerdamer/all.min"); // Use nerdamer
const variablesDB = require("../../database/schemas/variables"); // Database schema for variables
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculate an expression with stored variables!")
    .addSubcommandGroup((group) =>
      group
        .setName("temp-conversion")
        .setDescription(
          "Converts a temperature unit to Fahrenheit, Celsius, or Kelvin!",
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ctof")
            .setDescription("Converts Celsius to Fahrenheit")
            .addStringOption((option) =>
              option
                .setName("celsius")
                .setDescription("Celsius temperature to convert")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ctok")
            .setDescription("Converts Celsius to Kelvin")
            .addStringOption((option) =>
              option
                .setName("celsius")
                .setDescription("Celsius temperature to convert")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ftoc")
            .setDescription("Calculates Fahrenheit to Celsius")
            .addStringOption((option) =>
              option
                .setName("fahrenheit")
                .setDescription("Temperature in Fahrenheit")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ftok")
            .setDescription("Calculates Fahrenheit to Kelvin")
            .addStringOption((option) =>
              option
                .setName("fahrenheit")
                .setDescription("Temperature in Fahrenheit")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ktoc")
            .setDescription("Calculates Kelvin to Celsius")
            .addStringOption((option) =>
              option
                .setName("kelvin")
                .setDescription("Temperature in Kelvin")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ktof")
            .setDescription("Calculates Kelvin to Fahrenheit")
            .addStringOption((option) =>
              option
                .setName("kelvin")
                .setDescription("Temperature in Kelvin")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("measurement")
        .setDescription("Measurement conversions")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("convert")
            .setDescription("Convert between measurement units")
            .addStringOption((option) =>
              option
                .setName("value")
                .setDescription("Value to convert")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("from")
                .setDescription("Source unit (e.g. mi, km, ft)")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("to")
                .setDescription("Target unit (e.g. km, m, yd)")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("list").setDescription("Lists all accepted units"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("equation")
        .setDescription("Calculates an equation!")
        .addStringOption((option) =>
          option
            .setName("expression")
            .setDescription("The equation to evaluate")
            .setRequired(true),
        ),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const units = {
      length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.344,
        ft: 0.3048,
        in: 0.0254,
        yd: 0.9144,
      },
      mass: {
        kg: 1,
        g: 0.001,
        lb: 0.45359237,
        oz: 0.0283495231,
      },
      speed: {
        mps: 1,
        ftps: 0.3048,
        kph: 0.277777778,
        mph: 0.44704,
        kt: 0.514444,
      },
    };

    const unitAliases = {
      meter: "m",
      meters: "m",
      metre: "m",
      metres: "m",
      centimeter: "cm",
      centimeters: "cm",
      centimetre: "cm",
      centimetres: "cm",
      kilometer: "km",
      kilometers: "km",
      kilometre: "km",
      kilometres: "km",
      millimeter: "mm",
      millimeters: "mm",
      millimetre: "mm",
      millimetres: "mm",
      foot: "ft",
      feet: "ft",
      inch: "in",
      inches: "in",
      mile: "mi",
      miles: "mi",

      "m/s": "mps",
      meterpersecond: "mps",
      meterspersecond: "mps",
      "ft/s": "ftps",
      fps: "ftps",
      feetpersecond: "ftps",
      "km/h": "kph",
      kmph: "kph",
      "mi/hr": "mph",
      milesperhour: "mph",
      kts: "kt",
      knots: "kt",

      millibar: "mb",
      millibars: "mb",
      hectopascal: "hpa",
      hectopascals: "hpa",
      "in/hg": "inhg",
    };

    function normalizeUnit(unit) {
      if (!unit) return null;

      const cleaned = unit.toLowerCase().replace(/\s+/g, "").replace(/·/g, "/");

      return unitAliases[cleaned] ?? cleaned;
    }

    function convert(value, from, to, category) {
      const table = units[category];
      if (!table[from] || !table[to]) {
        throw new Error("Invalid unit");
      }

      const base = value * table[from];
      return base / table[to];
    }

    function findCategory(unit) {
      for (const [category, table] of Object.entries(units)) {
        if (unit in table) return category;
      }
      return null;
    }

    function formatUnitList(units) {
      let output = "";

      for (const [category, table] of Object.entries(units)) {
        output += `**${category.toUpperCase()}**\n`;

        for (const unit of Object.keys(table)) {
          const aliasList = Object.entries(unitAliases)
            .filter(([, target]) => target === unit)
            .map(([alias]) => alias);

          output += aliasList.length
            ? `• ${unit} (${aliasList.join(", ")})\n`
            : `• ${unit}\n`;
        }

        output += "\n";
      }

      return output.trim();
    }

    const client = interaction.client;
    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup(false);
    if (group === "temp-conversion") {
      const getNumber = (str, type) => {
        const val = interaction.options.getString(type);
        if (isNaN(val)) {
          interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });
          return null;
        }
        return val;
      };

      if (subcommand === "ctof") {
        const celsius = getNumber("celsius", "celsius");
        if (!celsius) return;
        const fahrenheit = nerdamer(`round(${celsius}*9/5+32,2)`).text();
        return interaction.reply({ content: `${fahrenheit}°F` });
      }

      if (subcommand === "ctok") {
        const celsius = getNumber("celsius", "celsius");
        if (!celsius) return;
        const kelvin = nerdamer(`round(${celsius}+273.15,2)`).text();
        return interaction.reply({ content: `${kelvin}°K` });
      }

      if (subcommand === "ftoc") {
        const fahrenheit = getNumber("fahrenheit", "fahrenheit");
        if (!fahrenheit) return;
        const celsius = nerdamer(`round((${fahrenheit}-32)*5/9,2)`).text();
        return interaction.reply({ content: `${celsius}°C` });
      }

      if (subcommand === "ftok") {
        const fahrenheit = getNumber("fahrenheit", "fahrenheit");
        if (!fahrenheit) return;
        const kelvin = nerdamer(
          `round(((${fahrenheit}-32)*5/9)+273.15,2)`,
        ).text();
        return interaction.reply({ content: `${kelvin}°K` });
      }

      if (subcommand === "ktoc") {
        const kelvin = getNumber("kelvin", "kelvin");
        if (!kelvin) return;
        const celsius = nerdamer(`round(${kelvin}-273.15,2)`).text();
        return interaction.reply({ content: `${celsius}°C` });
      }

      if (subcommand === "ktof") {
        const kelvin = getNumber("kelvin", "kelvin");
        if (!kelvin) return;
        const fahrenheit = nerdamer(
          `round(((${kelvin}-273.15)*9/5)+32,2)`,
        ).text();
        return interaction.reply({ content: `${fahrenheit}°F` });
      }
    } else if (group === "measurement") {
      if (subcommand === "convert") {
        const value = interaction.options.getString("value");
        const rawFrom = interaction.options.getString("from").toLowerCase();
        const rawTo = interaction.options.getString("to").toLowerCase();

        const from = normalizeUnit(rawFrom);
        const to = normalizeUnit(rawTo);

        const category = findCategory(from);
        if (!category || findCategory(to) !== category) {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setDescription(
                  `${client.emoji.fail} | These units are not compatible.`,
                )
                .setColor(client.color.red),
            ],
            ephemeral: true,
          });
        }

        const result = convert(value, from, to, category);
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${client.emoji.success} | Conversion done!\n\n🔁 **${value} ${from}** = **${result.toFixed(4)} ${to}**`,
              )
              .setColor(client.color.green),
          ],
        });
      } else if (subcommand === "list") {
        const list = formatUnitList(units);

        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(`Supported Measurement Units:\n\n${list}`)
              .setColor("BLURPLE"),
          ],
          ephemeral: true,
        });
      }
    }
    if (subcommand === "equation") {
      try {
        await interaction.deferReply();
        let input = interaction.options.getString("expression");

        // Fetch stored variables from the database
        const storedVars = await variablesDB.findOne({ _id: "variables" });
        const variables = storedVars ? storedVars.vars || {} : {}; // Extract variable object

        // Replace variables in the input expression
        for (const [varName, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\b${varName}\\b`, "g"); // Match whole variable names
          input = input.replace(regex, value);
        }

        function safeEvaluate(expression) {
          try {
            const result = evaluateExpression(expression);
            return result;
          } catch (e) {
            throw new Error(`${e.message}`);
          }
        }

        function finalTransformString(input) {
          // Block inputs with numbers or underscores
          input = input.replace(/pi/gi, "π"); // Normalize all forms of "pi" to lowercase

          // Insert * between π and a-z or A-Z
          input = input.replace(/π(?=[a-zA-Z])/g, "π*");
          input = input.replace(/(?<=[a-zA-Z])π/g, "*π");

          if (/[_]/.test(input)) return null;

          return transformRecursive(input);
        }

        function transformRecursive(input, inFunction = false) {
          let result = "";
          let i = 0;

          while (i < input.length) {
            if (/[a-zA-Z]/.test(input[i])) {
              // Check for function name followed by (
              let j = i;
              while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;

              if (input[j] === "(") {
                // It's a function
                const funcName = input.slice(i, j);
                const { content, end } = extractParenContent(input, j);

                // Recursively process inside the function
                const transformedInner = transformRecursive(content, true);
                result += funcName + "(" + transformedInner + ")";
                i = end + 1;
              } else {
                // Regular word (not function)
                const word = input.slice(i, j);
                result += addAsterisks(word);
                i = j;
              }
            } else if (input[i] === "(") {
              const { content, end } = extractParenContent(input, i);
              const transformedInner = transformRecursive(content, false);
              result += "(" + transformedInner + ")";
              i = end + 1;
            } else {
              result += input[i++];
            }
          }

          return result;
        }

        function extractParenContent(str, startIndex) {
          // Assumes str[startIndex] === '('
          let depth = 1;
          let i = startIndex + 1;

          while (i < str.length && depth > 0) {
            if (str[i] === "(") depth++;
            else if (str[i] === ")") depth--;
            i++;
          }

          return {
            content: str.slice(startIndex + 1, i - 1),
            end: i - 1,
          };
        }

        function addAsterisks(word) {
          return word.replace(/([a-zA-Z])(?=[a-zA-Z])/g, "$1*");
        }

        function evaluateExpression(expression) {
          let final = finalTransformString(expression);

          for (const [varName, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${varName}\\b`, "g");
            final = final.replace(regex, value);
          }

          try {
            return nerdamer(final, variables).evaluate().text();
          } catch {
            throw new Error("DIVIDE BY 0");
          }
        }

        let result = safeEvaluate(input);

        // Send the result
        await interaction.editReply({ content: `Result: \`${result}\`` });
      } catch (err) {
        await interaction.editReply({
          content: `ERROR: ${err.message}`,
          ephemeral: true,
        });
      }
    }
  },
};
