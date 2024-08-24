const { InteractionType } = require('discord.js');
const fs = require('fs');

class Interactions {
    constructor({client, messageRoomId}) {
        this.messageRoomId = messageRoomId;
        this.client = client;

        this.modules = {};
        this.commands = {};

        const baseCommands = fs.readdirSync(`./components/commands`).filter(file => file.endsWith(`.js`));
        this.commands[`base`] = baseCommands.map(commandFile => require(`./commands/${commandFile}`).toJSON().name);
        
        const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));
        for (const category of commandCategories) {
            const Module = require(`./commands/${category}/index.js`);
            this.modules[category] = new Module({client, messageRoomId});
            const commandFiles = fs.readdirSync(`./components/commands/${category}`).filter(file => file !== `index.js`);
            this.commands[category] = commandFiles.map(commandFile => require(`./commands/${category}/${commandFile}`).toJSON().name);
        }

        this.processCommands = this.processCommands.bind(this);
    }

    async processCommands(interaction) {
        if (interaction.type === InteractionType.ApplicationCommand) {
            for (const category of Object.keys(this.modules)) {
                if (this.commands[category].includes(interaction.commandName)) {
                    try {
                        await this.modules[category].processCommands(interaction);
                    } catch (err) {
                        console.log(err);
                    } finally {
                        return;
                    }
                }
            }
            switch(interaction.commandName) {
                case `help`: await this.help(interaction); break;
            }
        }
    }
    
    async close() {
        for (const Module of Object.values(this.modules)) {
            await Module.close();
        }
    }

    async help(interaction) {
        let helpMessage = `\`\`\`ini\nCommand Help:\n`;
        const category = interaction.options.getString(`category`);
        if (!!category) {
            helpMessage += `(${category} commands)\n`;
            helpMessage += this.commands[category]
            .map(command => {
                const commandDesc = require(`./commands/${category}/${command}.js`).toJSON().description;
                return `[/${command}]  ${commandDesc}\n`;
            }).join(``);
        } else {
            helpMessage += this.commands[`base`]
            .map(command => {
                const commandDesc = require(`./commands/${command}.js`).toJSON().description;
                return `[/${command}]  ${commandDesc}\n`;
            }).join(``);
        }
        helpMessage += `\`\`\``;
        await interaction.reply(helpMessage);
    }
}

module.exports = Interactions