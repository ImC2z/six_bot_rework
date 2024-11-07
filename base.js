require('dotenv').config();
const bot_key = process.env.hazelbotkey;

const { Client, GatewayIntentBits, Partials } = require('discord.js');
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
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.GuildScheduledEvents
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

// major modules setup
const Interactions = require('./components/interactions');
const Presences = require('./components/presences');
const VoiceStates = require('./components/voiceStates');
const ScheduledEvents = require('./components/scheduledEvents');
const homeTalkChannelId = "741199072433537104";
const interactions = new Interactions(client, homeTalkChannelId);
const presences = new Presences(client);
const voiceStates = new VoiceStates(client, interactions.modules[`audio`]);
const scheduledEvents = new ScheduledEvents(client, interactions.modules[`audio`]);

/**
 * Orders shutdown of all modules under Interactions, sends offlining message and shuts down client.
 */
async function clientShutdown() {
    await interactions.close();
    await client.channels.cache.get(homeTalkChannelId).send(`*has gone offline*`);
    await client.destroy();
    console.log(`Program: prg is kill 2`);
    process.exit();
}

// process CLI interrupt handling
process.on("SIGHUP", clientShutdown);
process.on("SIGTERM", clientShutdown);

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    presences.onReady();
    scheduledEvents.onReady();
    let textChannel = await client.channels.fetch(interactions.messageRoomId);
    await textChannel.send(`*has come online*`);
    
    /**
     * Loops CLI readline-in and sends to current message channel until Ctrl-C interrupt, then orders shutdown.
     */
    async function start() {
        for await (const line of rl) {
            if(line != "") {
                textChannel = await client.channels.fetch(interactions.messageRoomId);
                await textChannel.send(line);
            }
        }
        await clientShutdown();
    }
    start();
});

// client event handling
client.on(`error`, (err) => console.log(err));
client.on(`interactionCreate`, interactions.processCommands);
client.on(`presenceUpdate`, presences.onPresenceUpdate);
client.on(`voiceStateUpdate`, voiceStates.onVoiceStateUpdate);
client.on(`guildScheduledEventCreate`, scheduledEvents.onEventCreate);

client.login(bot_key);