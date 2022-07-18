require(`dotenv`).config();
const fs = require(`fs`);
const bot_key = process.env.hazelbotkey;
const { REST } = require(`@discordjs/rest`);
const { Routes } = require(`discord-api-types/v9`);

const commands = [];
const baseCommands = fs.readdirSync(`./components/commands`).filter(file => file.endsWith(`.js`));
for (const commandFile of baseCommands) {
  const command = require(`./components/commands/${commandFile}`);
  commands.push(command.toJSON());
}
const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));
for (const category of commandCategories) {
  const commandFiles = fs.readdirSync(`./components/commands/${category}`).filter(file => file !== `index.js`);
  for (const commandFile of commandFiles) {
    const command = require(`./components/commands/${category}/${commandFile}`);
    commands.push(command.toJSON());
  }
}

const rest = new REST({ version: `9` }).setToken(bot_key);
const CLIENT_ID = `995290849275547658`;
const GUILD_ID = `734674029587464213`; // 69 HOEm

(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();