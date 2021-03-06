const { nodes } = require("../../config.json");
const { Collection } = require("discord.js");
const NodeStore = require("./NodeStore.js");
const AudioPlayer = require("./AudioPlayer.js"); // eslint-disable-line
const AudioNode = require("./AudioNode.js"); // eslint-disable-line

/**
 * A custom LavaLink implementation for the bot.
 * @extends {Collection<string, AudioPlayer>}
 */
class AudioManager extends Collection {

    constructor(client) {
        super();
        Object.defineProperty(this, "client", { value: client });
        this.nodes = new NodeStore();
        for (let node of nodes) {
            // Create the node
            node = new AudioNode(this, node);
            this.nodes.set(node.host, node);
        }
    }

    /**
     * Relaunches each node.
     */
    relaunch() {
        for (let node of nodes) {
            // Create the node
            node = new AudioNode(this, node);
            this.nodes.set(node.host, node);
        }
    }

    /**
     * Makes the bot join a voice channel.
     * @param {string} data - An object containing values for the bot to join a voice channel.
     * @param {string} data.guildId - The guild that owns voice channel.
     * @param {string} data.channelId - The voice channel in the guild.
     * @param {boolean} [data.self_deafened] - Determines if the bot will be deafened when the bot joins the channel.
     * @param {boolean} [data.self_muted] - Determines if the bot will be muted when the bot joins the channel.
     * @param {boolean} data.host - The host of the AudioNode.
     * @returns {AudioPlayer} The new AudioPlayer
     */
    join(data) {
        this.client.ws.shards.get(0).send({
            op: 4,
            d: {
                guild_id: data.guildId,
                channel_id: data.channelId,
                self_deaf: data.self_deafened || false,
                self_mute: data.self_muted || false
            }
        });
        const node = this.nodes.get(data.host);
        if (!node) throw new Error(`No node with host: ${data.host} found.`);
        const oldPlayer = this.get(data.guildId);
        if (oldPlayer) return oldPlayer;
        const newPlayer = new AudioPlayer(data, node, this);
        this.set(data.guildId, newPlayer);
        this.client.emit("newPlayer", newPlayer);
        return newPlayer;
    }

    /**
     * Makes the bot leave a voice channel.
     * @param {string} id - The guild id to leave the channel.
     */
    leave(id) {
        this.client.ws.shards.get(0).send({
            op: 4,
            d: {
                guild_id: id,
                channel_id: null,
                self_deaf: false,
                self_mute: false
            }
        });
    }

};

module.exports = AudioManager;