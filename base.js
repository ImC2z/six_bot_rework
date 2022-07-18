require('dotenv').config();
const bot_key = process.env.hazelbotkey;
const { Client, GatewayIntentBits, Partials, InteractionType } = require('discord.js');
const client = new Client(
    { 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildMembers, 
            GatewayIntentBits.GuildMessageReactions, 
            GatewayIntentBits.GuildMessages, 
            GatewayIntentBits.GuildVoiceStates, 
            GatewayIntentBits.GuildPresences, 
            GatewayIntentBits.DirectMessages, 
            GatewayIntentBits.DirectMessageReactions
        ],
        partials: [
            Partials.Channel, 
            Partials.User, 
            Partials.GuildMember, 
            Partials.Message, 
            Partials.Reaction, 
            Partials.ThreadMember
        ]
    }
);
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
    if (!interaction.type === InteractionType.ApplicationCommand) return;
    // console.log(interaction);
    interactions.processCommands(interaction);
})

client.login(bot_key);