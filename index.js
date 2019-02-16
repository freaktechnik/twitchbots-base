/**
 * https://twitchbots.info generic API consumer
 * @author Martin Giger
 * @license MIT
 * @module twitchbots
 */

"use strict";

//TODO have an API definition that can check params and all that...
//TODO optional hard cache
//TODO auto paginate (both pages and more than 100 ids)

const fetch = require("isomorphic-fetch"),

    BASE_URI = "https://api.twitchbots.info/v2/",
    OK = 200,
    API_VERSIONS = [
        "Justin.tv API",
        "Kraken v1",
        "Kraken v3",
        "Kraken v5",
        "Helix",
        "Unsupported"
    ],
    BUSINESS_MODELS = [
        "Free",
        "Lifetime license",
        "Subscriptions",
        "Transaction fees"
    ];

class TwitchBots {
    static get API_VERSIONS() {
        return API_VERSIONS;
    }

    static get BUSINESS_MODELS() {
        return BUSINESS_MODELS;
    }

    async getBot(id) {
        const res = await fetch(`${BASE_URI}bot/${id}`);
        if(res.ok && res.status == OK) {
            return res.json();
        }
        throw new Error(`${id} is not a bot`);
    }

    async getBots(filter) {
        const params = new URLSearchParams(filter);
        const res = await fetch(`${BASE_URI}bot/?${params.toString()}`);
        if(res.ok && res.status == OK) {
            const data = await res.json();
            return data.bots;
        }
        throw new Error("Error fetching bots");
    }

    async getType(id) {
        const res = await fetch(`${BASE_URI}type/${id}`);
        if(res.ok && res.status == OK) {
            return res.json();
        }
        throw new Error(`No type with ID ${id}`);
    }

    async getTypes(filter) {
        const params = new URLSearchParams(filter);
        const res = await fetch(`${BASE_URI}type/?${params.toString()}`);
        if(res.ok && res.status == OK) {
            const data = await res.json();
            return data.types;
        }
        throw new Error("Error fetching types");
    }

    async getBotsForChannel(channelId) {
        const res = await fetch(`${BASE_URI}channel/${channelId}/bots`);
        if(res.ok && res.status == OK) {
            const data = await res.json();
            return data.bots;
        }
    }
}

module.exports = TwitchBots;
