// const { MessageAttachment, MessageEmbed } = require('discord.js')
// const getWeather = require('./apis/weather')
// const getUrban = require('./apis/urban')
// const getInspire = require('./apis/inspire')
const fs = require('fs')
// let e_resp = fs.readdirSync('./e')
// e_resp.forEach((element, i, arr) => {
//     arr[i] = new MessageAttachment(`./e/` + arr[i])
// })
// let cock_resp = fs.readdirSync('./cock')
// cock_resp.forEach((element, i, arr) => {
//     arr[i] = new MessageAttachment(`./cock/` + arr[i])
// })

// const AudioModule = require(`./audioModule/index`)
// const SingleLiners = require(`./singleLinersModule/index`)
// const StocksModule = require(`./stocksModule/index`)
// const MinecraftModule = require(`./minecraftModule/index`)
// const RolesModule = require(`./roleCreatorModule/index`)
// const WFMarketModule = require(`./warframeMarketModule/index`)
// const VSMonitor = require(`./voiceStateMonitor`)

// function random_resp(resp) {
//     return resp[Math.floor(Math.random()*resp.length)]
// }

// function msgHasInstance(message, list) {
//     for (const word of list) {
//         if (message.content.toLowerCase().includes(word)) return true
//     }
//     return false
// }

class Interactions {
    constructor(default_rm, client) {
        this.currentRm = default_rm
        this.client = client

        this.modules = {};
        this.commands = {};
        const baseCommands = fs.readdirSync(`./components/commands`).filter(file => file.endsWith(`.js`));
        this.commands[`base`] = []
        for (const commandFile of baseCommands) {
            const command = require(`./commands/${commandFile}`);
            this.commands[`base`].push(command);
        }
        const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));
        for (const category of commandCategories) {
            const module = require(`./commands/${category}/index.js`);
            this.modules[category] = new module(client);
            this.commands[category] = [];
            const commandFiles = fs.readdirSync(`./components/commands/${category}`).filter(file => file !== `index.js`);
            for (const commandFile of commandFiles) {
                const command = require(`./commands/${category}/${commandFile}`);
                this.commands[category].push(command.toJSON().name);
            }
        }
        this.categories = Object.keys(this.commands);
        // console.log(this.commands);
        // console.log(this.categories);
    }

    processCommands(interaction) {
        for (const category of this.categories) {
            if (interaction.commandName === `help`) {
                this.help(interaction);
                return;
            }
            if (this.commands[category].includes(interaction.commandName)) {
                this.modules[category].processCommands(interaction);
            }
        }
        // let fullCommand = message.content.substr(1) // Remove the leading $
        // let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
        // let command = splitCommand[0].toLowerCase() // The first word directly after the $ is the command
        // let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command
        
        // for (const moduleKey of this.modulesList) {
        //     if (this.modules[moduleKey].commands.includes(command)) {
        //         this.modules[moduleKey].processCommands(args, message, command)
        //         return
        //     }
        // }

        // switch (command) {
        //     // case 'urban': this.urban(args, message); break
        //     // case 'users': this.handleTags(args, message); break
        //     // case 'pickup': this.summonToRoom(message); break
        //     // case 'reload': this.reload(message); break
        //     // case 'maw2': this.goOffline(message); break
        //     // case 'ping2': this.ping(message); break
        //     case 'help2': this.help(args, message); break
        //     // case 'check': this.check(args, message); break
        //     default: message.channel.send("*confused hazel noises*")
        // }
    }
    
    summonToRoom(message) {
        this.currentRm = message.channel.id
        message.channel.send(`${message.author.toString()} *aaaaaaaaaa*`)
    }
    
    goOffline() {
        // for (const moduleKey of this.modulesList) {
        //     this.modules[moduleKey].close();
        // }
        this.client.destroy();
        console.log("Program: prg is kill 2");
        process.exit();
    }

    // reload(message) {
    //     e_resp = fs.readdirSync('./e')
    //     e_resp.forEach((element, i, arr) => {
    //         arr[i] = new MessageAttachment(`./e/` + arr[i])
    //     })
    //     cock_resp = fs.readdirSync('./cock')
    //     cock_resp.forEach((element, i, arr) => {
    //         arr[i] = new MessageAttachment(`./cock/` + arr[i])
    //     })
    //     message.channel.send("*clocks gun* U want sum?")
    // }

    // urban(args, message) {
    //     if(args.length !== 0) {
    //         getUrban(args.join(' '))
    //         .then(result => {
    //             if (result.length > 0) {
    //                 message.channel.send(this.createUrbanMessageEmbed(result[0]))
    //             }
    //             else {
    //                 message.channel.send(`${message.author.toString()} fuck you i don't get it`)
    //             }
    //         })
    //         .catch(err => console.log(err))
    //     } else {
    //         message.channel.send(`${message.author.toString()} what the fuck do you want`)
    //     }
    // }

    // createUrbanMessageEmbed({definition, permalink, word, example}) {
    //     const trim = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str)
    //     return new MessageEmbed()
    //     .setColor("FFFF00")
    //     .setTitle(word)
    //     .setURL(permalink)
    //     .addFields(
    //         { name: "Definition", value: trim(definition, 1024) },
    //         { name: "Example", value: trim(example, 1024) }
    //     )
    // }

    async help(interaction) {
        let helpMessage = `\`\`\`ini\nCommand Help:\n`;
        const category = interaction.options.getString(`category`);
        if (!!category) {
            helpMessage += `(${category} commands)\n`;
            const moduleCommands = fs.readdirSync(`./components/commands/${category}`)
                .filter(file => file.endsWith(`.js`))
                .filter(file => file !== `index.js`);
            for (const commandFile of moduleCommands) {
                const commandObj = require(`./commands/${category}/${commandFile}`).toJSON();
                helpMessage += `[/${commandObj.name}]  ${commandObj.description}\n`;
            }
        } else {
            const baseCommands = fs.readdirSync(`./components/commands`).filter(file => file.endsWith(`.js`));
            for (const commandFile of baseCommands) {
                const commandObj = require(`./commands/${commandFile}`).toJSON();
                helpMessage += `[/${commandObj.name}]  ${commandObj.description}\n`;
            }
        }
        helpMessage += `\`\`\``;
        await interaction.reply(helpMessage);
    }
}

module.exports = Interactions