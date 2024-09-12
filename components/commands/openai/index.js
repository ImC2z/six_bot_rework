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
            case `chat`: await this.chat({interaction}); break;
        }
    }

    async chat({interaction}) {
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
                const replyMessage = `OpenAI: ${response} (tokens used: ${prompt_tokens} In, ${completion_tokens} Out)`;
                const editReplyToInteraction = async (message) => await interaction.editReply(message);
                await this.processLongMessage(replyMessage, editReplyToInteraction);
            }
//             const replyMessage = `Lorem ipsum dolor sit amet. Ut eius rerum est maxime inventore et sunt galisum et commodi sequi nam minus voluptas est aliquam consequuntur. In sapiente voluptas sed quibusdam unde sed nisi cumque a ipsa totam! Aut vero natus aut quam velit quo corrupti voluptas ut dolorem voluptas et eaque veniam et nisi voluptatem eum omnis tenetur. Ea corrupti necessitatibus ut nemo enim ut ratione quos quo placeat cumque aut dolore modi et architecto amet cum eius dolorum. Id commodi asperiores vel quod nisi qui ipsa repudiandae ea omnis repudiandae a aliquam rerum. Ut quia laboriosam nam incidunt velit nam fugiat voluptatem rem provident omnis quo minima rerum. Qui nemo voluptatem et dolores distinctio et magnam consequuntur ut neque debitis. Et eveniet odio et voluptatem natus ut praesentium animi 33 culpa minus ea voluptatibus dolores ut nemo quaerat. Et galisum molestiae in veritatis eaque eum delectus quia. Et soluta rerum ut voluptas nostrum 33 perferendis ducimus et ipsum reprehenderit quo perspiciatis rerum est saepe laborum sit architecto minima. Aut iusto illum eos repudiandae odit et nostrum reprehenderit aut tenetur adipisci quo dolor nulla et minima consequatur. Et obcaecati quia et alias dolorum et rerum corporis sed reiciendis consequuntur non dolore distinctio sed vitae quia ut rerum cupiditate? Ad repellendus atque vel reiciendis illum sed voluptas culpa et dolorem omnis. Aut provident Quis rem placeat itaque et neque eius.

// Lorem ipsum dolor sit amet. Ut eius rerum est maxime inventore et sunt galisum et commodi sequi nam minus voluptas est aliquam consequuntur. In sapiente voluptas sed quibusdam unde sed nisi cumque a ipsa totam! Aut vero natus aut quam velit quo corrupti voluptas ut dolorem voluptas et eaque veniam et nisi voluptatem eum omnis tenetur. Ea corrupti necessitatibus ut nemo enim ut ratione quos quo placeat cumque aut dolore modi et architecto amet cum eius dolorum. Id commodi asperiores vel quod nisi qui ipsa repudiandae ea omnis repudiandae a aliquam rerum. Ut quia laboriosam nam incidunt velit nam fugiat voluptatem rem provident omnis quo minima rerum. Qui nemo voluptatem et dolores distinctio et magnam consequuntur ut neque debitis. Et eveniet odio et voluptatem natus ut praesentium animi 33 culpa minus ea voluptatibus dolores ut nemo quaerat. Et galisum molestiae in veritatis eaque eum delectus quia. Et soluta rerum ut voluptas nostrum 33 perferendis ducimus et ipsum reprehenderit quo perspiciatis rerum est saepe laborum sit architecto minima. Aut iusto illum eos repudiandae odit et nostrum reprehenderit aut tenetur adipisci quo dolor nulla et minima consequatur. Et obcaecati quia et alias dolorum et rerum corporis sed reiciendis consequuntur non dolore distinctio sed vitae quia ut rerum cupiditate? Ad repellendus atque vel reiciendis illum sed voluptas culpa et dolorem omnis. Aut provident Quis rem placeat itaque et neque eius.

// Lorem ipsum dolor sit amet. Ut eius rerum est maxime inventore et sunt galisum et commodi sequi nam minus voluptas est aliquam consequuntur. In sapiente voluptas sed quibusdam unde sed nisi cumque a ipsa totam! Aut vero natus aut quam velit quo corrupti voluptas ut dolorem voluptas et eaque veniam et nisi voluptatem eum omnis tenetur. Ea corrupti necessitatibus ut nemo enim ut ratione quos quo placeat cumque aut dolore modi et architecto amet cum eius dolorum. Id commodi asperiores vel quod nisi qui ipsa repudiandae ea omnis repudiandae a aliquam rerum. Ut quia laboriosam nam incidunt velit nam fugiat voluptatem rem provident omnis quo minima rerum. Qui nemo voluptatem et dolores distinctio et magnam consequuntur ut neque debitis. Et eveniet odio et voluptatem natus ut praesentium animi 33 culpa minus ea voluptatibus dolores ut nemo quaerat. Et galisum molestiae in veritatis eaque eum delectus quia. Et soluta rerum ut voluptas nostrum 33 perferendis ducimus et ipsum reprehenderit quo perspiciatis rerum est saepe laborum sit architecto minima. Aut iusto illum eos repudiandae odit et nostrum reprehenderit aut tenetur adipisci quo dolor nulla et minima consequatur. Et obcaecati quia et alias dolorum et rerum corporis sed reiciendis consequuntur non dolore distinctio sed vitae quia ut rerum cupiditate? Ad repellendus atque vel reiciendis illum sed voluptas culpa et dolorem omnis. Aut provident Quis rem placeat itaque et neque eius.

// Lorem ipsum dolor sit amet. Ut eius rerum est maxime inventore et sunt galisum et commodi sequi nam minus voluptas est aliquam consequuntur. In sapiente voluptas sed quibusdam unde sed nisi cumque a ipsa totam! Aut vero natus aut quam velit quo corrupti voluptas ut dolorem voluptas et eaque veniam et nisi voluptatem eum omnis tenetur. Ea corrupti necessitatibus ut nemo enim ut ratione quos quo placeat cumque aut dolore modi et architecto amet cum eius dolorum. Id commodi asperiores vel quod nisi qui ipsa repudiandae ea omnis repudiandae a aliquam rerum. Ut quia laboriosam nam incidunt velit nam fugiat voluptatem rem provident omnis quo minima rerum. Qui nemo voluptatem et dolores distinctio et magnam consequuntur ut neque debitis. Et eveniet odio et voluptatem natus ut praesentium animi 33 culpa minus ea voluptatibus dolores ut nemo quaerat. Et galisum molestiae in veritatis eaque eum delectus quia. Et soluta rerum ut voluptas nostrum 33 perferendis ducimus et ipsum reprehenderit quo perspiciatis rerum est saepe laborum sit architecto minima. Aut iusto illum eos repudiandae odit et nostrum reprehenderit aut tenetur adipisci quo dolor nulla et minima consequatur. Et obcaecati quia et alias dolorum et rerum corporis sed reiciendis consequuntur non dolore distinctio sed vitae quia ut rerum cupiditate? Ad repellendus atque vel reiciendis illum sed voluptas culpa et dolorem omnis. Aut provident Quis rem placeat itaque et neque eius.`;
//             const editReplyToInteraction = async (message) => await interaction.editReply(message);
//             await this.constructLongMessage(interaction, replyMessage, editReplyToInteraction);
        } catch (err) {
            console.log(err);
            await interaction.editReply(`OpenAI threw unknown error. Oops.`);
        }
    }

    async processLongMessage(message, replyMethod) {
        const countOccurrences = (string, search) => (string.match(new RegExp(search, `g`)) || []).length;
        const paragraphs = message.split(`\n\n`);
        let codeBlockActive = false;
        // const combinedParagraphs = paragraphs.reduce((prev, current) => {
        //     if (combining && prev.length) {
        //         prev[prev.length - 1] += `\n\n` + current;
        //     } else {
        //         prev.push(current);
        //     }
        //     // if (current.includes(`\`\`\``)) {
        //     //     combining = !combining;
        //     // }
        //     if (countOccurrences(current, `\`\`\``) % 2 === 1) { // odd occurrences to toggle combining
        //         combining = !combining;
        //     }
        //     return prev;
        // }, []);
        let codeBlockLang = undefined;
        const messageBlocks = paragraphs.reduce((prev, current) => {
            if (countOccurrences(current, `\`\`\``) % 2 === 1) { // odd occurrences to toggle combining
                codeBlockActive = !codeBlockActive;
                codeBlockLang = codeBlockActive ? current.match(/```(.*)\n/)[1] : undefined;
            }
            if (prev.length && (prev[prev.length - 1] + `\n\n` + current).length < 1950) {
                prev[prev.length - 1] += `\n\n` + current;
            } else {
                if (codeBlockActive) {
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

    async sendLongMessage(messageBlocks, replyMethod) {
        const messageBlock = messageBlocks.shift();
        const nextInteraction = await replyMethod(messageBlock);
        if (messageBlocks.length) {
            const replyToInteraction = async (message) => await nextInteraction.reply(message);
            await this.sendLongMessage(messageBlocks, replyToInteraction);
        }
    }

    // async constructLongMessage(message, replyMethod) {
    //     if (message.length > 2000) {
    //         const cutoff = message.slice(0, 1900).lastIndexOf(`\n\n`);
    //         let cutoffMessage = message.slice(0, cutoff);
    //         let remainingMessage = message.slice(cutoff + 2);
    //         if (cutoffMessage.match()) {
    //             cutoffMessage += `*`;
    //             remainingMessage = `*` + remainingMessage;
    //         }
    //         const nextInteraction = await replyMethod(cutoffMessage + ` ...`);
    //         const replyToInteraction = async (message) => await nextInteraction.reply(message);
    //         await this.constructLongMessage(remainingMessage, replyToInteraction);
    //     } else {
    //         await replyMethod(message);
    //     }
    // }

    close() {

    }
}

module.exports = OpenAIModule