const Discord = require("discord.js");
const Embeds = require("./embeds");
const config = require("../config.json");
const { checkConfig } = require("./other");
const fs = require("fs");

module.exports = {
	/**
	 * Help Embed with Select Menu
	 * @param {Discord.Interaction} interaction Any sort of interaction
	 * @param {Discord.User} user The user that initiated the command
	 * @param {boolean} reply Uses a reply or not
	 * @param {string} description Change the description
	 */
	showHelp(
		interaction,
		user,
		reply = true,
		description = "Select a command in the menu bellow\n\nThis bot is entirely new, and you might not get along with the commands, so that's why we made the `/help` better than ever!"
	) {
		function sortObj(obj, key) {
			function sortOn(property) {
				return function (a, b) {
					if (a[property] < b[property]) {
						return -1;
					} else if (a[property] > b[property]) {
						return 1;
					} else {
						return 0;
					}
				};
			}

			return obj.sort(sortOn(key));
		}

		options = [];
		let cmds = sortObj(config.cmds, "name");
		cmds.forEach((cmd) => {
			let option = {
				label: `/${cmd.name}`,
				description: cmd.description,
				value: cmd.name,
			};
			options.push(option);
		});

		const helpEmbed = new Discord.MessageEmbed()
			.setTitle("Help Menu")
			.setColor(Embeds.randomColor())
			.setDescription(description)
			.setFooter(user.tag, user.displayAvatarURL({ dynamic: true }));

		const cmdMenu = new Discord.MessageActionRow().addComponents(
			new Discord.MessageSelectMenu()
				.setCustomId("helpcmds")
				.setPlaceholder("Select a command")
				.addOptions(options)
		);

		if (reply === true)
			interaction.reply({ embeds: [helpEmbed], components: [cmdMenu] });
		if (reply === false) {
			interaction.deferReply();
			interaction.deleteReply();
			interaction.channel.send({ embeds: [helpEmbed], components: [cmdMenu] });
		}
	},

	async selectHelpMenu(interaction, value = interaction.values[0]) {
		checkConfig();
		const cmdhelp = value;
		config.cmds.forEach((cmd) => {
			if (cmdhelp == cmd.name) {
				if (typeof cmd.options !== "undefined") {
					output = "";
					cmd.options.forEach((option) => {
						if (option.required === true) {
							output = `${output} ${option.name} [Arg]`;
						}
					});
					var example = `${output}`;
				} else {
					var example = "";
				}
				cmdEmbed = new Discord.MessageEmbed()
					.setTitle(`/${cmd.name}`)
					.setDescription(
						`Description: \`${cmd.description}\`\nExample: \`/${cmd.name}${example}\``
					);
			}
		});
		if (typeof cmdEmbed !== "undefined") {
			interaction.reply({
				content: `Informations on /${cmdhelp}`,
				embeds: [cmdEmbed],
				ephemeral: true,
			});
			cmdEmbed = undefined;
		}
	},

	async initiate(client) {
		checkConfig();
		var a = [];
		const fileSep = __dirname.includes("/") ? "/" : "\\";
		const filePath = __dirname.split(/\/|\\/g).slice(0, -2).join(fileSep);
		const files = await fs.readdirSync(filePath + "/commands");
		const cmds = onlyJs(files);

		cmds.forEach((cmd) => {
			const rfile = require("../../commands/" + cmd.replace(".js", ""));
			a.push(rfile.data);
			console.log(`/${rfile.data.name}`);
		});

		/**@type {Discord.Guild} */
		const guild = await client.guilds.cache.get("1033451342984908900");
		await guild?.commands.set(a);
		await guild?.commands?.cache.each(async (cmd) => {
				if (cmd.description.toLowerCase() === "locked") {
					await cmd.setDefaultMemberPermissions("Administrator");
					console.log("locked command");
				} else {
					console.log("global command");
				}
			});
		console.log("Initialized all commands");

		/**
		 * It takes an array of file names, and returns an array of only the file names that end with ".js"
		 * @param {Array<String>} files - An array of file names.
		 * @returns {Array<String>} An array of file names with .js at the end.
		 */
		function onlyJs(files) {
			var output = [];
			files.forEach((file) => {
				if (file.endsWith(".js")) {
					output.push(file);
				} else {
					console.log(file + " isn't .js");
				}
			});

			return output;
		}

		/**
		 * It takes a directory name and returns the path to that directory
		 * @param {String} mainDirectory - The name of the directory you want to get the path of.
		 * @param {String} fileSeparator - The file separator for the current OS.
		 * @returns {String} The directory of the main directory.
		 */
		function fixDirName(
			mainDirectory,
			fileSeparator = __dirname.includes("/") ? "/" : "\\"
		) {
			const splitted = __dirname.split(fileSeparator);

			if (splitted[0] === "") splitted.shift();

			const directoryIndex = splitted.indexOf(mainDirectory);
			if (directoryIndex === -1)
				throw new RangeError(`No directory found with index -1`);

			for (let i = 0; i < Number(splitted.length - directoryIndex); i++) {
				splitted.pop();
			}

			return splitted.join(fileSeparator);
		}
	},
};
