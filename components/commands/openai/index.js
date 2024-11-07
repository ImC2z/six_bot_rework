const { CommandInteraction } = require("discord.js");
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.openaikey,
    organization: process.env.openorg,
    project: process.env.openprj,
});

/**
 * OpenAI module with optionally persistent chat completion.
 */
class OpenAIModule {
    /**
     * @param {Object} moduleInfo
     * @param {Client} moduleInfo.client Bot client
     * @param {string} moduleInfo.messageRoomId Default text message channel id
     */
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
        this.chatHistory = [];
    }

    /**
     * Calls command functionality acccording to user request.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async processCommands(interaction) {
        switch(interaction.commandName) {
            case `chat`: await this.chat(interaction); break;
        }
    }

    /**
     * Replies with OpenAI chat completion, and optionally store chat history.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async chat(interaction) {
        const prependLastResponses = interaction.options.getBoolean(`prepend_last_responses`) || false;
        const content = interaction.options.getString(`query`);
        await interaction.deferReply();
        try {
            const completion = await openai.chat.completions.create({
                messages: prependLastResponses ? [...this.chatHistory, {role: `user`, content}] : [{role: `user`, content}],
                model: `gpt-4o-mini`,
                temperature: 0.7
            });
            // console.log(completion);
            if (!!completion.error) {
                console.log(completion.error);
                await interaction.editReply(`OpenAI threw known error. Gotta check.`);
            } else {
                const { prompt_tokens, completion_tokens } = completion.usage;
                const { content: response } = completion.choices[0].message;
                const replyMessage = `OpenAI: ${response} (tokens used: ${prompt_tokens} In, ${completion_tokens} Out)`;
                const editReplyToInteraction = async (message) => await interaction.editReply(message);
                await this.processLongMessage(replyMessage, editReplyToInteraction);
                if (prependLastResponses) {
                    this.chatHistory.push({role: `user`, content}, {role: `assistant`, content: response});
                } else {
                    this.chatHistory = [{role: `user`, content}, {role: `assistant`, content: response}];
                }
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply(`OpenAI threw unknown error. Oops.`);
        }
    }

    /**
     * Breaks down long messages into array of smaller message blocks for helper function.
     * @param {string} message Entire original message
     * @param {Function} replyMethod Callback to reply/editReply to previous interaction
     */
    async processLongMessage(message, replyMethod) {
        const countOccurrences = (string, search) => (string.match(new RegExp(search, `g`)) || []).length;
        const paragraphs = message.split(`\n\n`);
        let codeBlockActive = false;
        let codeBlockLang = undefined;
        const messageBlocks = paragraphs.reduce((prev, current) => {
            if (countOccurrences(current, `\`\`\``) % 2 === 1) { // odd occurrences to toggle combining
                codeBlockActive = !codeBlockActive;
                codeBlockLang = codeBlockActive ? current.match(/```(.*)\n/)[1] : undefined;
            }
            if (prev.length && (prev[prev.length - 1] + `\n\n` + current).length < 1950) {
                prev[prev.length - 1] += `\n\n` + current;
            } else {
                if (prev.length && codeBlockActive) {
                    prev[prev.length - 1] += `\`\`\``;
                    prev.push(`\`\`\`${codeBlockLang}\n` + current);
                } else {
                    prev.push(current);
                }
            }
            return prev;
        }, []);
        await this.sendLongMessage(messageBlocks, replyMethod);
    }

    /**
     * Recursive helper function that chains reply/editReply to user interaction
     * @param {string[]} messageBlocks Array of reduced message blocks for each reply/editReply
     * @param {Function} replyMethod Callback to reply/editReply to previous interaction
     */
    async sendLongMessage(messageBlocks, replyMethod) {
        const messageBlock = messageBlocks.shift();
        const nextInteraction = await replyMethod(messageBlock);
        if (messageBlocks.length) {
            const replyToInteraction = async (message) => await nextInteraction.reply(message);
            await this.sendLongMessage(messageBlocks, replyToInteraction);
        }
    }

    /**
     * Module close handler.
     */
    close() {

    }
}

module.exports = OpenAIModule