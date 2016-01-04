/**
 * https://twitchbots.info generic API consumer
 * @author Martin Giger
 * @license MIT
 * @module twitchbots-base
 */

"use strict";

const paginationHelper = require("./pagination");

const DAY = 1000 * 60 * 60 * 24;
const WEEK = 7 * DAY;
const BASE_URI = "https://api.twitchbots.info/v1/";

function TwitchBots(options) {
    this.request = options.request;
    this.bots = {};
    this.types = {};
    this.cacheTimes = {};
}

TwitchBots.prototype.isBotExpired = function(username) {
    return Date.now() - this.bots[username]._timestamp >= WEEK;
};

TwitchBots.prototype.isTypeExpired = function(typeId) {
    return Date.now() - this.types[typeId]._timestamp >= DAY;
};

TwitchBots.prototype.hasValidBot = function(username) {
    return username in this.bots && !this.isBotExpired(username);
};

TwitchBots.prototype.hasValidType = function(typeId) {
    return typeId in this.types && !this.isTypeExpired(typeId);
};

TwitchBots.prototype._addBot = function(bot) {
    bot._timestamp = Date.now();
    bot.isBot = true;
    delete bot._links;
    this.bots[bot.username] = bot;

    return bot;
};

TwitchBots.prototype._addUser = function(username) {
    var user = {
        username: username,
        type: null,
        isBot: false,
        _timestamp: Date.now()
    };
    this.bots[username] = user;

    return user;
};

TwitchBots.prototype.getBot = function(username) {
    if(!this.hasValidBot(username)) {
        return this.request(BASE_URI + "bot/" + username).then((response) => {
            return this._addBot(response);
        }, (error) => {
            if(error.code == 404) {
                return this._addUser(username);
            }
            throw error;
        });
    }
    else {
        return Promise.resolve(this.bots[username]);
    }
};

TwitchBots.prototype.getBots = function(usernames) {
    const usersToFetch = usernames.filter((username) => !this.hasValidBot(username));

    let fetching;
    if(usersToFetch.length == 1) {
        fetching = this.getBot(usersToFetch[0]);
    }
    else if(usersToFetch.length > 1) {
        paginationHelper({
            url: BASE_URI + "bot/?limit=100&bots=" + usersToFetch.join(",") + "&offset=",
            request: this.request
        }).then((bots) => {
            bots.forEach((bot) => {
                this._addBot(bot);
            });

            usernames
                .filter((name) => bots.every((bot) => bot.username != name))
                .forEach((username) => this._addUser(username));
        });
    }
    else {
        fetching = Promise.resolve();
    }

    return fetching.then(() => usernames.map((username) => this.bots[username]));
};

TwitchBots.prototype.getAllBots = function() {
    if(Date.now() - this.cacheTimes["all"] >= DAY) {
        return paginationHelper({
            url: BASE_URI + "bot/all?limit=100&offset=",
            request: this.request
        }).then((bots) => {
            this.cacheTimes["all"] = Date.now();
            return bots.map((bot) => this._addBot(bot));
        });
    }
    else {
        return Promise.resolve(this.bots.values());
    }
};

TwitchBots.prototype.getAllBotsByType = function(typeId) {
    if(Date.now() - this.cacheTimes[typeId] >= DAY) {
        return paginationHelper({
            url: BASE_URI + "bot/all?limit=100&type=" + typeId + "&offset=",
            request: this.request
        }).then((bots) => {
            this.cacheTimes[typeId] = Date.now();
            return bots.map((bot) => this._addBot(bot));
        })
    }
    else {
        return Promise.resolve(this.bots.values().filter(function(bot) {
            return bot.type == typeId;
        });
    }
};

TwitchBots.prototype.getType = function(typeId) {
    if(!this.hasValidType(typeId)) {
        return this.request(BASE_URI + "type/" + typeId).then((response) => {
            response._timestamp = Date.now();
            delete response._links;
            this.types[typeId] = response;

            return response;
        });
    }
    else {
        return Promise.resolve(this.types[typeId]);
    }
};

module.exports = TwitchBots;
