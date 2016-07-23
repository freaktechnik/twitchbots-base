import test from 'ava';
import TwitchBots from '../';

const DAY = 60 * 60 * 1000 * 24
const WEEK = DAY * 7;
const request = (url) => Promise.reject(url);
const getBot = (username) => {
    return {
        username,
        channel: null,
        type: 0,
        _links: {
            self: "https://api.twitchbots.info/v1/bot/"+username,
            type: "https://api.twitchbots.info/v1/type/1"
        }
    };
};

const getType = (id) => {
    return {
        id,
        name: "test type",
        multiChannel: true,
        url: "https://www.nightbot.tv",
        _links: {
            self: "https://api.twitchbots.info/v1/type/"+id,
            bots: "https://api.twitchbots.info/v1/bot/all?type="+id
        }
    };
};

test("Constructor works", (t) => {
    const tb = new TwitchBots({ request });

    t.is(tb.request, request);
});

test("Expired bot expired", (t) => {
    const timestamp = Date.now() - WEEK;
    const tb = new TwitchBots({ request });

    tb.bots.test = { _timestamp: timestamp };

    t.true(tb.isBotExpired("test"));
});

test("Not expired bot expired", (t) => {
    const timestamp = Date.now() - WEEK + 10000;
    const tb = new TwitchBots({ request });

    tb.bots.foo = { _timestamp: timestamp };
    tb.bots.bar = { _timestamp: Date.now() };

    t.false(tb.isBotExpired("foo"));
    t.false(tb.isBotExpired("bar"));
});

test("Expired type expired", (t) => {
    const timestamp = Date.now() - DAY;
    const tb = new TwitchBots({ request });

    tb.types.test = { _timestamp: timestamp };

    t.true(tb.isTypeExpired("test"));
});

test("Not expired type expired", (t) => {
    const timestamp = Date.now() - DAY + 10000;
    const tb = new TwitchBots({ request });

    tb.types.foo = { _timestamp: timestamp };
    tb.types.bar = { _timestamp: Date.now() };

    t.false(tb.isTypeExpired("foo"));
    t.false(tb.isTypeExpired("bar"));
});

test("Has valid valid bot", (t) => {
    const tb = new TwitchBots({ request });

    tb.bots.test = { _timestamp: Date.now() };

    t.true(tb.hasValidBot("test"));
});

test("Not has valid bot", (t) => {
    const tb = new TwitchBots({ request });

    t.false(tb.hasValidBot("test"));
});

test("Expired bot is not valid", (t) => {
    const timestamp = Date.now() - WEEK;
    const tb = new TwitchBots({ request });

    tb.bots.test = { _timestamp: timestamp };

    t.false(tb.hasValidBot("test"));
});

test("Has valid valid type", (t) => {
    const tb = new TwitchBots({ request });

    tb.types.test = { _timestamp: Date.now() };

    t.true(tb.hasValidType("test"));
});

test("Not has valid type", (t) => {
    const tb = new TwitchBots({ request });

    t.false(tb.hasValidType("test"));
});

test("Expired type is not valid", (t) => {
    const timestamp = Date.now() - DAY;
    const tb = new TwitchBots({ request });

    tb.types.test = { _timestamp: timestamp };

    t.false(tb.hasValidType("test"));
});

test("Add bot", (t) => {
    const tb = new TwitchBots({ request });

    const bot = getBot("test");
    const creationTS = Date.now();

    const returnedBot = tb._addBot(bot);

    t.true(bot.username in tb.bots);
    const savedBot = tb.bots[bot.username];

    t.deepEqual(savedBot, returnedBot);
    t.true(savedBot._timestamp >= creationTS);
    t.true(savedBot._timestamp <= Date.now());
    t.is(savedBot.channel, bot.channel);
    t.is(savedBot.username, bot.username);
    t.is(savedBot.type, bot.type);
    t.false("_links" in savedBot);
    t.true(savedBot.isBot);
});

test("Add user", (t) => {
    const creationTS = Date.now();
    const username = "test";
    const tb = new TwitchBots({ request });

    const returnedUser = tb._addUser(username);

    t.true(username in tb.bots);
    const savedUser = tb.bots[username];

    t.deepEqual(returnedUser, savedUser);
    t.true(savedUser._timestamp >= creationTS);
    t.true(savedUser._timestamp <= Date.now());
    t.is(savedUser.username, username);
    t.is(savedUser.type, null);
    t.false(savedUser.isBot);
});

test("Get existing uncached bot", async (t) => {
    t.plan(3);
    const username = "test";
    const requestBot = (url) => {
        t.pass("Requested new bot");
        return Promise.resolve(getBot(username))
    };
    const tb = new TwitchBots({ request: requestBot });

    const bot = await tb.getBot(username);

    t.is(bot.username, username);
    t.true(bot.isBot);
});

test("Get expired cached bot", async (t) => {
    t.plan(3);
    const creationTS = Date.now() - WEEK;
    const bot = getBot("test");
    const requestBot = (url) => {
        t.pass("Requested new version of the bot");
        return Promise.resolve(bot);
    };

    const tb = new TwitchBots({ request: requestBot });
    tb._addBot(bot);
    tb.bots[bot.username]._timestamp = creationTS;

    const newBot = await tb.getBot(bot.username);

    t.is(bot.username, newBot.username);
    t.true(newBot._timestamp > creationTS);
});

test("Get cached bot", async (t) => {
    const bot = getBot("test");

    const tb = new TwitchBots({ request });
    tb._addBot(bot);

    const returnedBot = await tb.getBot(bot.username);

    t.deepEqual(returnedBot, bot);
});

test("Get uncached user", async (t) => {
    t.plan(3);
    const username = "test";
    const requestUser = (url) => {
        t.pass("Requesting user");
        return Promise.reject({
            code: 404
        });
    };

    const tb = new TwitchBots({ request: requestUser });

    const returnedUser = await tb.getBot(username);

    t.is(returnedUser.username, username);
    t.false(returnedUser.isBot);
});

test("Get bot throws network error", (t) => {
    const requestUser = (url) => {
        return Promise.reject({
            code: 500
        });
    };
    const tb = new TwitchBots({ request: requestUser });
    t.throws(tb.getBot("test"));
});

test("Get type throws network error", (t) => {
    const requestType = (url) => {
        return Promise.reject({
            code: 404
        });
    };
    const tb = new TwitchBots({ request: requestType });
    t.throws(tb.getType(-1));
});

test("Get uncached existing type", async (t) => {
    const type = getType(0);
    const requestType = (url) => {
        return Promise.resolve(type);
    };

    const tb = new TwitchBots({ request: requestType });

    const returnedType = await tb.getType(type.id);

    t.true(type.id in tb.types);
    const savedType = tb.types[type.id];

    t.deepEqual(savedType, returnedType);

    t.is(returnedType.id, type.id);
    t.is(returnedType.name, type.name);
    t.is(returnedType.url, type.url);
    t.is(returnedType.multiChannel, type.multiChannel);
    t.true("_timestamp" in returnedType);
    t.false("_links" in returnedType);
});

test("Get cached expired type", async (t) => {
    t.plan(4);
    const createdTS = Date.now() - DAY;
    const type = getType(0);
    const requestType = (url) => {
        t.pass("Request type");
        return Promise.resolve(type);
    };
    const tb = new TwitchBots({ request: requestType });
    await tb.getType(type.id);
    tb.types[type.id]._timestamp = createdTS;

    const returnedType = await tb.getType(type.id);

    t.true(returnedType._timestamp > createdTS);
    t.is(returnedType.id, type.id);
});

test("Get cached type", async (t) => {
    const type = getType(0);
    const tb = new TwitchBots({ request });

    const internalType = {
        id: type.id,
        name: type.name,
        url: type.url,
        _timestamp: Date.now(),
        multiChannel: type.multiChannel
    };
    tb.types[type.id] = internalType;

    const returnedType = await tb.getType(type.id);

    t.deepEqual(returnedType, internalType);
});

