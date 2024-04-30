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
            const module = require(`./commands/${category}/index.js`);
            this.modules[category] = new module({client, messageRoomId});
            const commandFiles = fs.readdirSync(`./components/commands/${category}`).filter(file => file !== `index.js`);
            this.commands[category] = commandFiles.map(commandFile => require(`./commands/${category}/${commandFile}`).toJSON().name);
        }
    }

    processCommands(interaction) {
        for (const category of Object.keys(this.modules)) {
            if (this.commands[category].includes(interaction.commandName)) {
                this.modules[category].processCommands(interaction);
                return;
            }
        }
        switch(interaction.commandName) {
            case `help`: this.help(interaction); break;
        }
    }
    
    summonToRoom(message) {
        this.messageRoomId = message.channel.id
        message.channel.send(`${message.author.toString()} *aaaaaaaaaa*`)
    }
    
    async close() {
        for (const module of Object.values(this.modules)) {
            await module.close();
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