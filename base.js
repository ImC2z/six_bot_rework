require('dotenv').config();
const bot_key = process.env.hazelbotkey;
const { Client, Intents } = require('discord.js');
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS);
const client = new Client({ intents: myIntents });
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const Interactions = require('./components/interaction');   
const interactions = new Interactions("741199072433537104", client);

client.on('ready', () => {
    // console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("my dad play Warframe", {type: "WATCHING"});
    // client.channels.cache.get(messaging.currentRm).send("*has returned from the TV*")
    // priceReport();
    
    async function start() {
        for await (const line of rl) {
            if(line != "") {
                const textChannel = await client.channels.fetch(interactions.currentRm);
                const message = await textChannel.send(line);
                // if (line.startsWith(`$t `)) {
                //     messaging.processCommands(message)
                // }
            }
        }
        interactions.goOffline();
    }
    start();
});

// client.on('messageCreate', ms => {
//     interactions.handleOnMessage(ms);
// });

client.on(`interactionCreate`, interaction => {
    if (!interaction.isApplicationCommand()) return;
    // console.log(interaction);
    interactions.processCommands(interaction);
})

client.login(bot_key);