const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the current song'),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ No music is currently playing!')
                    .setColor(0xFF0000);
                return interaction.editReply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You need to be in the same voice channel as the bot!')
                    .setColor(0xFF0000);
                return interaction.editReply({ embeds: [embed] })
            }

            const player = conditions.player;
            const currentTrack = player.current;

            if (!currentTrack || !currentTrack.info) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ No track is currently playing!')
                    .setColor(0xFF0000);
                return interaction.editReply({ embeds: [embed] })
            }

            const artist = currentTrack.info.author || 'Unknown Artist';
            const title = currentTrack.info.title || 'Unknown Title';

            const lyrics = await this.fetchLyrics(artist, title);

            if (!lyrics) {
                const embed = new EmbedBuilder()
                    .setDescription(`❌ **Lyrics not found!**\n**${title}** by ${artist}\n\nSorry, lyrics are not available in the database.`)
                    .setColor(0xFF0000);
                return interaction.editReply({ embeds: [embed] });
            }

            const lyricsChunks = this.chunkLyrics(lyrics, 4096);
            
            const firstEmbed = new EmbedBuilder()
                .setTitle(`🎤 ${title}`)
                .setDescription(lyricsChunks[0])
                .setColor(0x00FF00)
                .setFooter({ text: `👤 ${artist} • 🌿 Weedify Bot` });

            if (currentTrack.info.artworkUrl) {
                firstEmbed.setThumbnail(currentTrack.info.artworkUrl);
            }

            await interaction.editReply({ embeds: [firstEmbed] });

            if (lyricsChunks.length > 1) {
                for (let i = 1; i < lyricsChunks.length; i++) {
                    const embed = new EmbedBuilder()
                        .setDescription(lyricsChunks[i])
                        .setColor(0x00FF00)
                        .setFooter({ text: `Page ${i + 1}/${lyricsChunks.length}` });
                    await interaction.followUp({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error('Lyrics command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while fetching lyrics!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] })
        }
    },

    async fetchLyrics(artist, title) {
        try {
            const geniusApi = require('genius-lyrics-api');
            const apiKey = process.env.GENIUS_API_KEY;

            if (!apiKey) {
                console.log('No Genius API key found, using fallback API');
                return await this.fetchLyricsFallback(artist, title);
            }

            const options = {
                apiKey: apiKey,
                title: title.replace(/\s*\(.*?\)\s*/g, '').trim(),
                artist: artist.replace(/\s*\(.*?\)\s*/g, '').trim(),
                optimizeQuery: true
            };

            const lyrics = await geniusApi.getLyrics(options);
            
            if (lyrics) {
                return lyrics;
            }

            return await this.fetchLyricsFallback(artist, title);

        } catch (error) {
            console.error('Genius lyrics fetch error:', error);
            return await this.fetchLyricsFallback(artist, title);
        }
    },

    async fetchLyricsFallback(artist, title) {
        try {
            const cleanArtist = encodeURIComponent(artist.replace(/\s*\(.*?\)\s*/g, '').trim());
            const cleanTitle = encodeURIComponent(title.replace(/\s*\(.*?\)\s*/g, '').trim());
            
            const url = `https://api.lyrics.ovh/v1/${cleanArtist}/${cleanTitle}`;
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Weedify-Bot/1.0'
                }
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.lyrics || null;

        } catch (error) {
            console.error('Fallback lyrics fetch error:', error);
            return null;
        }
    },

    chunkLyrics(lyrics, maxLength) {
        const chunks = [];
        const lines = lyrics.split('\n');
        let currentChunk = '';

        for (const line of lines) {
            if ((currentChunk + line + '\n').length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                
                if (line.length > maxLength) {
                    chunks.push(line.substring(0, maxLength));
                    continue;
                }
            }
            currentChunk += line + '\n';
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }
};
