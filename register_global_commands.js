require(`dotenv`).config();
const fs = require(`fs`);
const bot_key = process.env.hazelbotkey;
const { REST } = require(`@discordjs/rest`);
const { Routes } = require(`discord-api-types/v9`);

const baseCommands = fs.readdirSync(`./components/commands`).filter(file => file.endsWith(`.js`));
const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));

const commands = [
    ...baseCommands.map(commandFile => require(`./components/commands/${commandFile}`).toJSON()),
    ...commandCategories.map(category => {
        const commandFiles = fs.readdirSync(`./components/commands/${category}`).filter(file => file !== `index.js`);
        return commandFiles.map(commandFile => require(`./components/commands/${category}/${commandFile}`).toJSON());
    }).reduce((total, current) => total.concat(current))
];

const rest = new REST({ version: `10` }).setToken(bot_key);
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