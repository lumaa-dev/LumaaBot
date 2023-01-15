const Discord = require("discord.js");
const config = require("./functions/config.json");
const Func = require("./functions/all");
const { createClient } = require("./functions/js/client");
const { ActivityType } = require("discord.js");

/**
 * @type {Discord.Client}
 */
const client = createClient();

client.once(Discord.Events.ClientReady, async () => {
	await Func.Commands.initiate(client)
	await client.user.setActivity({ name: "Project: Lumaa", type: ActivityType.Watching });
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
	} else if (interaction.isModalSubmit()) {
		let { customId: id } = interaction

		try {
			if (id.startsWith("issue")) {
				/**@type {Discord.TextChannel} */
				var channel = interaction.guild.channels.cache.get("1058536908151595118");
				var color = Discord.Colors.Blurple;
				const type = id.split("_", 1)[1];

				console.log(channel);
				if (type === "mod") {
					channel = channel.threads.cache.get("1061673209809879050");
					color = Discord.Colors.Red;
				} else if (type === "bot") {
					channel = channel.threads.cache.get("1061673209809879050");
					color = Discord.Colors.Orange;
				} else if (type === "temp") {
					channel = channel.threads.cache.get("1061676441705644122");
					color = Discord.Colors.Green;
				} else {
					channel = channel.threads.cache.get("1061676126872809502");
					color = Discord.Colors.DarkButNotBlack;
				}

				let embed = new Discord.EmbedBuilder()
				.setTitle(interaction.fields.getTextInputValue("body"))
				.setColor(color)
				.setDescription(interaction.fields.getTextInputValue("text"))

				console.log(channel)
				await interaction.reply({ content: `Look! We pinged you in <#${channel.id}> to get the issue resolved.`, ephemeral: true })
				await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] })
			}
		} catch (e) {
			console.error(e)
		}
	}
});

client.login(config.token);
