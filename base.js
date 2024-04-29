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

const Interactions = require('./components/interactions');
const Presences = require('./components/presences');
const VoiceStates = require('./components/voiceStates');
const homeTalkChannel = "741199072433537104";
const interactions = new Interactions({client, messageRoomId: homeTalkChannel});
const presences = new Presences({client});
const voiceStates = new VoiceStates({client, audioModule: interactions.modules[`audio`]});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    presences.onReady();
    let textChannel = await client.channels.fetch(interactions.messageRoomId);
    await textChannel.send(`*has come online*`)
    
    async function start() {
        for await (const line of rl) {
            if(line != "") {
                textChannel = await client.channels.fetch(interactions.messageRoomId);
                await textChannel.send(line);
            }
        }
        interactions.goOffline();
    }
    start();
});

client.on(`interactionCreate`, interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    // console.log(interaction);
    interactions.processCommands(interaction);
})

client.on(`presenceUpdate`, (oldPresence, newPresence) => presences.onPresenceUpdate(oldPresence, newPresence));

client.on(`voiceStateUpdate`, (oldVoiceState, newVoiceState) => voiceStates.onVoiceStateUpdate(oldVoiceState, newVoiceState));

client.login(bot_key);