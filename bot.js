const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs"); 
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const UserBlocked = new Set(); 
const prefix = '#';




client.on('ready',() => {
client.user.setGame('#help');
});

client.on('warn', console.warn);




client.on("message", async message => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (!message.member.voiceChannel) return;
    let messageArray = message.content.split(" ");
    let command = messageArray[0];

if (command === prefix+ `join`) {

        message.member.voiceChannel.join()
    message.channel.send('**Joined**')
};

});


///music

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => { 
console.log(`
------------------------------------------------------
> Logging in...
------------------------------------------------------
Logged in as ${client.user.tag}
Working on ${client.guilds.size} servers!
${client.channels.size} channels and ${client.users.size} users cached!
I am logged in and ready to roll!
LET'S GO!
------------------------------------------------------
-------------------------------------------------------
------------------------------------------------------
----------------------Bot's logs----------------------`);


});

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

client.on('reconnecting', () => console.log('I am reconnecting now!'));

client.on('message', async msg => { // eslint disable line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(prefix)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);

    if (msg.content.startsWith(`${prefix}play`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}play command in ${msg.guild.name}`);

        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'I\'m sorry but you need to be in a voice channel to play music!'
              }
            ]
          }
        });
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "❌ Error",
                    value: 'I cannot connect to your voice channel, make sure I have the proper permissions!'
                  }
                ]
              }
            });
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "❌ Error",
                    value: 'I cannot speak to your voice channel, make sure I have the proper permissions!'
                  }
                ]
              }
            });
        }
        
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true) // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "✅ Added playlist",
                    value: `Playlist: **${playlist.title}** has been added to the queue!`
                  }
                ]
              }
            });
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send({embed: {
                        color: 15158332,
                        fields: [{
                            name: ":mag_right:  YouTube Search Results :",
                            value: `${videos.map(video2 => `\`${++index}\` **-** ${video2.title}`).join('\n')}`
                          },
                          {
                              name: "You have 10 seconds!",
                              value: "Provide a value to select on of the search results ranging from 1-10."
                          }
                        ]
                      }
                    }).then(message =>{message.delete(20000)})
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send({embed: {
                            color: 15158332,
                            fields: [{
                                name: "❌ Error",
                                value: 'No or invalid value entered, cancelling video selection...'
                              }
                            ]
                          }
                        }).then(message =>{message.delete(5000)})
                    }
                    const videoIndex = (response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send({embed: {
                        color: 15158332,
                        fields: [{
                            name: "❌ Error",
                            value: 'I could not obtain any search results.'
                          }
                        ]
                      }
                    }).then(message =>{message.delete(5000)})
                }
            }

            return handleVideo(video, msg, voiceChannel);
        }
    } else if (msg.content.startsWith(`${prefix}skip`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}skip command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'You are not in a voice channel!'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing that I could skip for you.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if (msg.content.startsWith(`${prefix}stop`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}stop command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'You are not in a voice channel!'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing that I could stop for you.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return undefined;
    } else if (msg.content.startsWith(`${prefix}vol`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}vol command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'You are not in a voice channel!'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        if (!args[1]) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "🔊 Volume",
                value: `The current volume is: **${serverQueue.volume}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "🔊 Volume",
                value: `I set the volume to: **${args[1]}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    } else if (msg.content.startsWith(`${prefix}np`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}np command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing that I could skip for you.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "🎵 Now playing",
                value: `**${serverQueue.songs[0].title}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    } else if (msg.content.startsWith(`${prefix}queue`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}queue command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing that I could skip for you.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "📋 Song queue",
                value: `${serverQueue.songs.map(song => `**- ${song.title}**`).join('\n')}`
              },
              {
                  name: "🎵 Now playing",
                  value: `**${serverQueue.songs[0].title}**`
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        } else if(msg.content.startsWith(`${prefix}help`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}nvm command in ${msg.guild.name}`);

        msg.channel.send('Please check your direct messages :inbox_tray:').then(message =>{message.delete(5000)})

        msg.react('✅');

        msg.author.send({embed: {
            color: 15158332,
            author: {
              name: client.user.username,
              icon_url: client.user.avatarURL
            },
            fields: [{
                name: "Bot's commands:",
                value: `**${prefix}help** - This message!\n\
**${prefix}play** - Play a song from YouTube.\n\
**${prefix}skip** - Skip a song.\n\
**${prefix}stop** - Stops the music.\n\
**${prefix}vol** - Change the volume of the bot.\n\
**${prefix}np** - The song that now playing.\n\
**${prefix}queue** - See the queue of songs.\n\
**${prefix}pause** - Pause the music.\n\
**${prefix}resume** - Resume the music.`
              }
            ],
            timestamp: new Date(),
            footer: {
              icon_url: client.user.avatarURL,
              text: "Legend-Music"
            }
          }
        });
    } else if (msg.content.startsWith(`${prefix}pause`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}pause command in ${msg.guild.name}`);
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "⏯️ Pause",
                value: 'Paused the music for you!'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
        }
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing.'
              }
            ]
          }
        }).then(message =>{message.delete(2000)})
    } else if (msg.content.startsWith(`${prefix}resume`)) {
        console.log(`${msg.author.tag} has been used the ${prefix}resume command in ${msg.guild.name}`);

        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing =  true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "⏯️ Resume",
                    value: 'Resumed the music for you!'
                  }
                ]
              }
            }).then(message =>{message.delete(5000)})
        }
        return msg.channel.send({embed: {
            color: 15158332,
            fields: [{
                name: "❌ Error",
                value: 'There is nothing playing or something is already playing.'
              }
            ]
          }
        }).then(message =>{message.delete(5000)})
    }

    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
        const song = {
            id: video.id,
            title: Util.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send({embed: {
                    color: 15158332,
                    fields: [{
                        name: "❌ Error",
                        value: `I could not join the voice channel: ${error}`
                      }
                    ]
                  }
                });
            }
        } else {
            serverQueue.songs.push(song);
            if (playlist) return undefined;
            else return msg.channel.send({embed: {
                color: 15158332,
                fields: [{
                    name: "✅ Added song",
                    value: `**${song.title}** has been added to the queue!`
                  }
                ]
              }
            }).then(message =>{message.delete(5000)})
        }
        return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log('Song ended.');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.log(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send({embed: {
        color: 15158332,
        fields: [{
            name: "✅ Start playing",
            value: `Start playing: **${song.title}**`
          }
        ]
      }
    }).then(message =>{message.delete(5000)})
}

client.login(process.env.BOT_TOKEN);
