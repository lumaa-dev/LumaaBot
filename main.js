const Discord = require("discord.js");
const { default: axios } = require("axios");
const config = require("./functions/config.json");
const Func = require("./functions/all");
const { createClient } = require("./functions/js/client");
const { ActivityType } = require("discord.js");
const { setClient } = require("./functions/js/other");

/**
 * @type {Discord.Client}
 */
const client = createClient();

client.once(Discord.Events.ClientReady, async () => {
	await Func.Commands.initiate(client)
	await client.user.setActivity({ name: "Project: Lumaa", type: ActivityType.Watching });
	client.ghCalls = await remainingCalls();
	setClient(client);
	console.log(`${client.user.tag} is logged`);
});

client.on(Discord.Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		let { commandName: name } = interaction;

		try {
			require("./commands/" + name).execute(interaction);
		} catch (e) {
			console.error(e)
		}
	} else if (interaction.isAutocomplete()) {
		let { commandName: name } = interaction;

		try {
			require("./commands/" + name).autocomplete(interaction);
		} catch (e) {
			console.error(e)
		}
	}
});

client.login(config.token);

/**
 * Axios's `get` function but for GitHub
 * @param {String} api 
 * @returns {Promise<import("axios").AxiosResponse<any, any>>}
 */
 async function githubApi(api) {
	let x = await (await axios.get(api, {headers: { "Authorization": `Bearer ${require("./functions/config.json").gh_token}`}}));
    console.log(x);
    return x;
}

async function remainingCalls() {
    let result = await githubApi("https://api.github.com/users/lumaa-dev"); // random api call
    return Number(result.headers.toJSON()["x-ratelimit-remaining"])
    // if (result.data.response)
}