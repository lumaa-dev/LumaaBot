const { ActivityType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
	createClient(intents = []) {
		const client = new Discord.Client({ intents: intents });
		if (!client || typeof client == "undefined")
			return console.error("Discord changed the way to get new clients");
		return client;
	},
};
