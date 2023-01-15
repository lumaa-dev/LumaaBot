const { PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");

const { createChannel } = require("../js/channels");
const { randomColor } = require("../js/embeds");
const { correctEpoch } = require("../js/other");

module.exports = {
	async lockChannel(channel) {
		if (!channel) return console.error("No channel to lock");

		await channel.updateOverwrite(channel.guild.roles.everyone, {
			SEND_MESSAGES: false,
		});
		return console.log("Locked channel");
	},

	async unlockChannel(channel) {
		if (!channel) return console.error("No channel to unlock");

		await channel.updateOverwrite(channel.guild.roles.everyone, {
			SEND_MESSAGES: true,
		});
		return console.log("Unlocked channel");
	},

	async kick(interaction) {
		if (interaction.member.permissions.has(["KICK_MEMBERS"])) {
			const { user } = interaction.options.get("user");
			try {
				const member = interaction.guild.members.cache.get(user.id);
				const reason =
					interaction.options.get("reason")?.value ?? "*Any reasons provided*";
				if (member.kickable === true) {
					const kickEmbed = new Discord.MessageEmbed()
						.setTitle(`${member.user.username} has been kicked.`)
						.addField(
							"User kicked:",
							`<@${member.user.id}> (${member.user.id})`,
							true
						)
						.addField("Kicked by:", `<@${interaction.user.id}>`, true)
						.addField("Reason:", reason);
					interaction.reply({ embeds: [kickEmbed] });
					member.send(`You got kicked from __${interaction.guild.name}__.`);
					member.kick();
				} else {
					const notKickEmbed = new Discord.MessageEmbed()
						.setTitle("You cannot kick that user!")
						.setDescription(
							"He's maybe having a higher role than you.\nOr just that you can't kick him."
						);
					interaction.reply({
						content: `Epic kick fail`,
						embeds: [notKickEmbed],
					});
				}
			} catch (e) {
				interaction.reply({
					ephemeral: true,
					content: `We got an internal problem:\n__${e}__\n\nPlease report this as fast as you can!`,
				});
				console.error(e);
			}
		} else {
			interaction.reply({
				ephemeral: true,
				content: `You don't have the required permissions.`,
			});
		}
	},

	async ban(interaction) {
		if (interaction.member.permissions.has(["BAN_MEMBERS"])) {
			const { user } = interaction.options.get("user");
			const member = interaction.guild.members.cache.get(user.id);
			const reason =
				interaction.options.get("reason")?.value ?? "*Any reasons provided*";
			if (member.bannable === true) {
				const banEmbed = new Discord.MessageEmbed()
					.setTitle(`${member.user.username} has been banned.`)
					.addField(
						"User banned:",
						`<@${member.user.id}> (${member.user.id})`,
						true
					)
					.addField("Banned by:", `<@${interaction.user.id}>`, true)
					.addField("Reason:", reason);
				interaction.reply({ embeds: [banEmbed] });
				member.send(`You got banned from __${interaction.guild.name}__.`);
				member.ban();
			} else {
				const notBanEmbed = new Discord.MessageEmbed()
					.setTitle("<:g_no:870870938529460244> You cannot ban that user!")
					.setDescription(
						"He's maybe having a higher role than you.\nOr just that you can't ban him."
					);
				interaction.reply({ content: `Epic ban fail`, embeds: [notBanEmbed] });
			}
		} else {
			interaction.reply({
				ephemeral: true,
				content: `You don't have the required permissions.`,
			});
		}
	},

	/**@param {Discord.ChatInputCommandInteraction} interaction */
	async mute(interaction) {
		const member = interaction.options.getMember("member");
		const reason = interaction.options.get("reason")?.value ?? "*Any reasons provided*";
		if (member.manageable() !== true)
			return interaction.reply({
				ephemeral: true,
				content: `You can't mute that user.`,
			});
		muteRole = interaction.guild.roles.cache.find(
			(role) => role.name == "Mute"
		);
		createdRole = false;
		if (!muteRole || typeof muteRole === "undefined") {
			muteRole = await interaction.guild.roles.create({
				name: "Mute",
				color: "RED",
				hoist: true,
				mentionable: false,
				permissions: [PermissionFlagsBits.CreateInstantInvite, PermissionFlagsBits.Connect],
			});
			createdRole = true;
		}
		interaction.guild.channels.cache.forEach(async (_channel) => {
			if (
				_channel.type == Discord.ChannelType.GuildText ||
				_channel.type == Discord.ChannelType.GuildAnnouncement ||
				_channel.type == Discord.ChannelType.GuildForum ||
				_channel.type == Discord.ChannelType.GuildCategory
			) {
				await _channel.permissionOverwrites.create(
					muteRole,
					{
						SEND_MESSAGES: false,
						ADD_REACTIONS: false,
						USE_PUBLIC_THREADS: false,
						USE_PRIVATE_THREADS: false,
					},
					{ type: 0 }
				);
			} else if (
				_channel.type == Discord.ChannelType.GuildVoice ||
				_channel.type == Discord.ChannelType.GuildStageVoice
			) {
				await _channel.permissionOverwrites.create(
					muteRole,
					{ SPEAK: false, STREAM: false, REQUEST_TO_SPEAK: false },
					{ type: 0 }
				);
			}
		});
		if (member.roles.cache.has(muteRole.id) == true)
			return interaction.reply({
				ephemeral: true,
				content: `<:g_no:870870938529460244> <@${member.user.id}> is already muted.`,
			});
		member.roles.add(muteRole);
		const muteEmbed = new Discord.MessageEmbed()
			.setTitle(`${member.user.username} has been muted`)
			.setFooter(
				`Created role: ${createdRole ? `Yes (${muteRole.id})` : `No`}`
			)
			.addField("User muted:", `<@${member.user.id}>`, true)
			.addField("Muted by:", `<@${interaction.member.user.id}>`, true)
			.addField("Role added", `<@&${muteRole.id}>`, true)
			.addField("Reason:", reason);

		interaction.reply({ embeds: [muteEmbed] });
	},

	async clearChannel(interaction) {
		if (interaction.member.permissions.has(["MANAGE_CHANNELS"])) {
			const _channel =
				interaction.options.get("channel")?.channel ?? interaction.channel;
			const clearedChannel = await _channel.clone({
				position: _channel.rawPosition,
			});
			_channel.delete();

			const newChannelEmbed = new Discord.MessageEmbed()
				.setTitle("Channel cleared perfectly")
				.setDescription(
					`Cleared by <@${interaction.member.user.id}> <t:${correctEpoch(
						new Date(Date.now()).getTime()
					)}:R>`
				)
				.setColor(randomColor());
			clearedChannel.send({ embeds: [newChannelEmbed] });
			try {
				interaction.reply({
					embeds: [
						newChannelEmbed.setDescription(
							`Cleared <#${clearedChannel.id}> by <@${
								interaction.member.user.id
							}> <t:${correctEpoch(new Date(Date.now()).getTime())}:R>`
						),
					],
				});
			} catch (e) {}
		}
	},

	async whoIs(interaction) {
		const user = interaction.options.get("user")?.user ?? interaction.user;
		const member = await interaction.guild.members.cache.get(user.id);

		const created = Utils.correctEpoch(Date.parse(user.createdAt).toString());
		const joined = Utils.correctEpoch(member.guild.joinedTimestamp);
		const _roles = member._roles;

		__roles = [];
		_roles.forEach((role) => {
			__roles.push(`<@&${role}>`);
		});
		const roles = __roles.join(", ") ?? "*No roles found*";

		const whoisEmbed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
			.setFooter(`ID: ${user.id}`)
			.addField("Account Created", `<t:${created}:R>`, true)
			.addField("Joined", `<t:${joined}:R>`, true)
			.addField("Roles", roles, true)
			.addField("User", `<@${user.id}>`)
			.setColor("RANDOM");

		interaction.reply({ ephemeral: true, embeds: [whoisEmbed] });
	},

	async smartLock(interaction) {
		if (!interaction.member.permissions.has(["MANAGE_CHANNELS"]))
			return interaction.reply({
				ephemeral: true,
				content: `You don't have the required permissions.`,
			});
		const channel =
			interaction.options.get("channel")?.channel ?? interaction.channel;
		const perms = channel
			.permissionsFor(interaction.guild.roles.everyone)
			.has("SEND_MESSAGES");
		if (perms === false) this.unlockChannel(channel);
		if (perms === true) this.lockChannel(channel);

		interaction.reply({
			content: `<:g_yes:870871799519412224> ${
				perms ? "Locked" : "Unlocked"
			} successfully <#${channel.id}>`,
			ephemeral: true,
		});
		if (channel !== interaction.channel) channel.send("Channel unlocked");
	},

	async messageTicket(client, interaction) {
		if (interaction.member.permissions.has(["MANAGE_CHANNELS"])) {
			const title =
				interaction.options.get("title")?.value ?? "Create a ticket";
			const description =
				interaction.options.get("description")?.value ??
				"Click on the button bellow to create a ticket.";
			const channel =
				interaction.options.get("channel")?.channel ?? interaction.channel;

			const ticketEmbed = new Discord.MessageEmbed()
				.setTitle(title)
				.setDescription(description)
				.setFooter("Using " + client.user.tag)
				.setColor("BLURPLE");

			const ticketBtn = new Discord.MessageActionRow().addComponents([
				new Discord.MessageButton()
					.setCustomId("createticket")
					.setStyle("PRIMARY")
					.setEmoji("✉️")
					.setLabel("Create a ticket"),
			]);

			interaction.defer();
			channel.send({ embeds: [ticketEmbed], components: [ticketBtn] });
			interaction.deleteReply();
		}
	},

	async buttonTicket(interaction, thread = false, categoryName = "Tickets") {
		if (interaction.customId == "createticket") {
			if (thread === true) {
				const thread = await interaction.channel.threads.create({
					name: `Ticket ${interaction.member.user.id}`,
					autoArchiveDuration: 60,
					reason: "Ticket Button",
				});
				thread.send(
					`Explain your problem\n\n<@${interaction.member.user.id}> ||<@${interaction.guild.ownerId}>||`
				);
				interaction.channel.lastMessage.delete();
			} else {
				await interaction.deferReply();

				const category =
					(await interaction.guild.channels.cache.find(
						(category) => category.name === categoryName
					)) ??
					(await createChannel(
						interaction.guild,
						categoryName,
						"GUILD_CATEGORY",
						false,
						0
					));

				if (
					!(await interaction.guild.channels.cache.find(
						(channel) => channel.name === `Ticket ${interaction.member.user.id}`
					))
				) {
					let ticket = await createChannel(
						interaction.guild,
						`Ticket ${interaction.member.user.id}`,
						"GUILD_TEXT",
						false,
						0,
						category
					);

					this.addPerms(ticket, interaction.member);

					ticket.send({
						content: `Your ticket is now opened, only moderators can close tickets.\n<@${interaction.member.user.id}>`,
					});
				} else {
					await interaction.editReply({
						content: `You already have a opened ticket!`,
					});
				}
			}
		}
	},

	async addPerms(channel, member) {
		await channel.permissionOverwrites.create([
			{
				id: member,
				allow: [
					Discord.Permissions.FLAGS.SEND_MESSAGES,
					Discord.Permissions.FLAGS.VIEW_CHANNEL,
					Discord.Permissions.FLAGS.CONNECT,
				],
				deny: [
					Discord.Permissions.FLAGS.USE_PUBLIC_THREADS,
					Discord.Permissions.FLAGS.USE_PRIVATE_THREADS,
					Discord.Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
				],
			},
			{
				id: interaction.guild.id,
				deny: [
					Discord.Permissions.FLAGS.SEND_MESSAGES,
					Discord.Permissions.FLAGS.VIEW_CHANNEL,
					Discord.Permissions.FLAGS.CONNECT,
					Discord.Permissions.FLAGS.USE_PUBLIC_THREADS,
					Discord.Permissions.FLAGS.USE_PRIVATE_THREADS,
					Discord.Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
				],
			},
		]);
	},

	async removePerms(member) {
		await channel.permissionOverwrites.create([
			{
				id: member.user.id,
				deny: [
					Discord.Permissions.FLAGS.SEND_MESSAGES,
					Discord.Permissions.FLAGS.VIEW_CHANNEL,
					Discord.Permissions.FLAGS.CONNECT,
					Discord.Permissions.FLAGS.USE_PUBLIC_THREADS,
					Discord.Permissions.FLAGS.USE_PRIVATE_THREADS,
					Discord.Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
				],
			},
			{
				id: interaction.guild.id,
				deny: [
					Discord.Permissions.FLAGS.SEND_MESSAGES,
					Discord.Permissions.FLAGS.VIEW_CHANNEL,
					Discord.Permissions.FLAGS.CONNECT,
					Discord.Permissions.FLAGS.USE_PUBLIC_THREADS,
					Discord.Permissions.FLAGS.USE_PRIVATE_THREADS,
					Discord.Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
				],
			},
		]);
	},
};
