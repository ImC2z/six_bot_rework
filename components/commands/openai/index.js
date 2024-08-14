const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.openaikey,
    organization: process.env.openorg,
    project: process.env.openprj,
});

class OpenAIModule {
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
    }

    async processCommands(interaction) {
        switch(interaction.commandName) {
            case `prompt`: await this.prompt({interaction}); break;
        }
    }

    async prompt({interaction}) {
        const content = interaction.options.getString(`query`);
        await interaction.deferReply();
        try {
            const completion = await openai.chat.completions.create({
                messages: [{role: `user`, content}],
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
                await interaction.editReply(`OpenAI: ${response} (tokens used: ${prompt_tokens} In, ${completion_tokens} Out)`);
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply(`OpenAI threw unknown error. Oops.`);
        }
    }

    close() {

    }
}

module.exports = OpenAIModule