const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType, StringSelectMenuInteraction, ChannelSelectMenuBuilder, ChannelType, ChannelSelectMenuInteraction, Message, GuildChannel, TextBasedChannelMixin, BaseGuildTextChannel, TextChannel, Embed } = require("discord.js");
const { awaitInteraction, toggleButton, awaitMessage } = require("../functions/js/cmds")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("embed") // global
    .setDescription("Play around with embeds freely")
    .setDescriptionLocalization("fr", "Jouez avec les embeds facilement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    /**
     * Embed Command
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        var steps = {
            current: 1,
            max: "?"
        }
        /**@type {{ oldInt: StringSelectMenuInteraction, message: Message, channel: TextChannel, embedMessage: Message }} */
        var keep = { oldInt: null, message: null, channel: null, embedMessage: null };

        const presentEmbed = new EmbedBuilder()
        .setDescription("Use the menu down below to select the action you want.")
        .setColor("Green")
        .setFooter({ text:`${steps.current}/${steps.max}` })

        const actionrow = new ActionRowBuilder()
        .setComponents(
            new StringSelectMenuBuilder()
                .setCustomId("embed_choice")
                .setMinValues(0)
                .setMaxValues(1)
                .setOptions({
                    label: "Create an embed",
                    value: "create",
                    emoji: {
                        name: "🎨"
                    }
                }, {
                    label: "Modify an embed",
                    value: "modify",
                    description: "Use the same method of creating for modifying",
                    emoji: {
                        name: "✏️"
                    }
                })
        )
        
        var isCreating = false;
        keep.message = await interaction.reply({ embeds: [presentEmbed], components: [actionrow] })

        await awaitInteraction(keep.message, interaction.user, ComponentType.StringSelect, async (/**@type {StringSelectMenuInteraction} */ _interaction) => {
            steps.current++
            steps.max = 3
            if (_interaction.customId === "embed_choice") {
                isCreating = _interaction.values[0] === "create";

                let disabledActionrow = new ActionRowBuilder()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("embed_choice")
                        .setMinValues(0)
                        .setMaxValues(1)
                        .setDisabled(true)
                        .setOptions({
                            label: "Create an embed",
                            value: "create",
                            emoji: {
                                name: "🎨"
                            },
                            default: isCreating
                        }, {
                            label: "Modify an embed",
                            value: "modify",
                            description: "Use the same method of creating for modifying",
                            emoji: {
                                name: "✏️"
                            },
                            default: !isCreating
                        })
                )

                await interaction.editReply({ components: [disabledActionrow] })

                if (!isCreating) {
                    let actionrow = new ActionRowBuilder()
                    .setComponents(
                        new ChannelSelectMenuBuilder()
                            .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread, ChannelType.PrivateThread)
                            .setCustomId("modify_channel")
                            .setMinValues(0)
                            .setMaxValues(1)
                            .setPlaceholder("#choose-a-channel")
                    )
                    
                    let stepEmbed = new EmbedBuilder()
                    .setDescription("Select the channel the embed you want to modify is in.")
                    .setColor("Green")
                    .setFooter({ text:`${steps.current}/${steps.max}` })

                    keep.message = await _interaction.reply({ embeds: [stepEmbed], components: [actionrow] })
                }
            }
            keep.oldInt = _interaction;
        });

        if (!isCreating) {
            await awaitInteraction(keep.message, interaction.user, ComponentType.ChannelSelect, async (/**@type {ChannelSelectMenuInteraction} */ _interaction) => {
                steps.current++
                keep.channel = await interaction.guild.channels.fetch(_interaction.values[0])
    
                let actionrow = new ActionRowBuilder()
                .setComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId("dummy")
                        .setPlaceholder("#choose-a-channel")
                        .setDisabled(true)
                )
    
                await keep.oldInt.update({ components: [actionrow] })

                let stepEmbed = new EmbedBuilder()
                    .setDescription("Write the message's ID with the embed (in this channel). **Don't include anything else.**")
                    .setColor("Green")
                    .setFooter({ text:`${steps.current}/${steps.max}` })
                
                _interaction.reply({ embeds: [stepEmbed] })
                keep.oldInt = _interaction;
            })

            /**@type {Embed?} */
            var embed = null;
            await awaitMessage(interaction.channel, interaction.user, async (message) => {
                steps.current++
                keep.message = message;

                keep.embedMessage = await keep.channel.messages.fetch(message.content.trim())
                message.delete()
                if (keep.embedMessage.author.id === keep.message.author.id && keep.embedMessage.embeds.length > 0) {
                    embed = keep.embedMessage.embeds[0]
                } else {
                    let stepEmbed = new EmbedBuilder()
                    .setDescription("The message fetched does not fit this action.")
                    .setColor("Red")
                    .setFooter({ text:`${steps.current}/${steps.max}` })

                    message.channel.send({ embeds: [stepEmbed] })
                }
            })
        }
    }
}