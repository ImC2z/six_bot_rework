const { SlashCommandBuilder } = require(`discord.js`);

const resultTypes = [
	{ name: `video`, value: `video` },
	{ name: `playlist`, value: `playlist` }
];

const data = new SlashCommandBuilder()
.setName(`p`)
.setDescription(`Play a YT video or playlist`)
.addStringOption(option =>
	option.setName(`query`)
	.setDescription(`URL or search query`)
	.setRequired(false)
)
.addStringOption(option => 
	option.setName(`type`)
	.setDescription(`Set to search only videos or playlists`)
	.setRequired(false)
	.addChoices(...resultTypes)
)
.addBooleanOption(option => 
	option.setName(`shuffle`)
	.setDescription(`Shuffle the current queue after adding`)
	.setRequired(false)
);

module.exports = data