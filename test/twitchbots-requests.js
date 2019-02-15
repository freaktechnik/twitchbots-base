import test from 'ava';
import TwitchBots from '..';
import _ from 'underscore';

const DAY = 60 * 60 * 1000 * 24;
const WEEK = DAY * 7;
const request = (url) => Promise.reject(url);
const getBot = (username, type = 0) => ({
    username,
    channel: null,
    type,
    _links: {
        self: `https://api.twitchbots.info/v1/bot/${username}`,
        type: `https://api.twitchbots.info/v1/type/${type}`
    }
});

const getType = (id) => ({
    id,
    name: "test type",
    multiChannel: true,
    url: "https://www.nightbot.tv",
    _links: {
        self: `https://api.twitchbots.info/v1/type/${id}`,
        bots: `https://api.twitchbots.info/v1/bot/all?type=${id}`
    }
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

test("Convert bot to user", (t) => {
    const username = "test";
    const tb = new TwitchBots({ request });
    tb._addBot(getBot(username));

    const returnedUser = tb._addUser(username);

    t.true(username in tb.bots);
    const savedUser = tb.bots[username];

    t.deepEqual(returnedUser, savedUser);
    t.false(savedUser.isBot);
    t.is(savedUser.type, null);
});

test("Convert user to bot", (t) => {
    const username = "test";
    const tb = new TwitchBots({ request });
    tb._addUser(username);

    const returnedBot = tb._addBot(getBot(username));

    t.true(username in tb.bots);
    const savedBot = tb.bots[username];

    t.deepEqual(savedBot, returnedBot);
    t.true(savedBot.isBot);
    t.not(savedBot.type, null);
});

test("Get existing uncached bot", async (t) => {
    t.plan(3);
    const username = "test";
    const requestBot = (url) => {
        t.is(url, `https://api.twitchbots.info/v1/bot/${username}`);
        return Promise.resolve(getBot(username));
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
        t.is(url, `https://api.twitchbots.info/v1/bot/${bot.username}`);
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
        t.is(url, `https://api.twitchbots.info/v1/bot/${username}`);
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
    const requestUser = () => Promise.reject({
        code: 500
    });
    const tb = new TwitchBots({ request: requestUser });
    return t.throwsAsync(tb.getBot("test"));
});

test("Get type throws network error", (t) => {
    const requestType = () => Promise.reject({
        code: 404
    });
    const tb = new TwitchBots({ request: requestType });
    return t.throwsAsync(tb.getType(-1));
});

test("Get uncached existing type", async (t) => {
    const type = getType(0);
    const requestType = (url) => {
        t.is(url, "https://api.twitchbots.info/v1/type/0");
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
        t.is(url, `https://api.twitchbots.info/v1/type/${type.id}`);
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

test("Get bots with one cached and one fetched", async (t) => {
    t.plan(3);

    const requestBot = (url) => {
        t.is(url, "https://api.twitchbots.info/v1/bot/test");

        return Promise.resolve(getBot("test"));
    };
    const tb = new TwitchBots({ request: requestBot });
    tb._addBot(getBot("bar"));
    tb._addBot(getBot("foo"));

    const bots = await tb.getBots([
        "test",
        "bar"
    ]);

    t.is(bots.length, 2);
    t.true("test" in tb.bots);
});

test("Get bots with two fetched", async (t) => {
    t.plan(3);

    const requestBots = (url) => {
        t.is(url, "https://api.twitchbots.info/v1/bot/?limit=100&bots=foo,bar,baz&offset=0");

        return Promise.resolve({
            bots: [
                getBot("foo"),
                getBot("bar")
            ],
            _links: {
                next: null
            },
            limit: 100
        });
    };
    const tb = new TwitchBots({ request: requestBots });
    tb._addBot(getBot("test"));

    const bots = await tb.getBots([
        "foo",
        "bar",
        "baz"
    ]);

    t.is(bots.length, 3);
    t.false(tb.bots.baz.isBot);
});

test("Get bots with all cached", async (t) => {
    const tb = new TwitchBots({ request });

    tb._addBot(getBot("test"));
    tb._addBot(getBot("foo"));
    tb._addBot(getBot("bar"));

    const bots = await tb.getBots([
        "test",
        "foo"
    ]);

    t.is(bots.length, 2);
});

test("Get all bots uncached", async (t) => {
    t.plan(4);
    const allBotsRequest = (url) => {
        t.is(url, "https://api.twitchbots.info/v1/bot/all?limit=100&offset=0");

        return Promise.resolve({
            bots: [ getBot("test") ],
            _links: {
                next: null
            },
            limit: 100,
            offest: 0
        });
    };
    const tb = new TwitchBots({ request: allBotsRequest });

    const bots = await tb.getAllBots();

    t.is(bots.length, 1);
    t.deepEqual(bots, _.values(tb.bots));
    t.false("_links" in bots[0]);
});

test("Get all bots expired cache", async (t) => {
    t.plan(5);
    const allBotsRequest = (url) => {
        t.is(url, "https://api.twitchbots.info/v1/bot/all?limit=100&offset=0");

        return Promise.resolve({
            bots: [ getBot("test") ],
            _links: {
                next: null
            },
            limit: 100,
            offest: 0
        });
    };
    const tb = new TwitchBots({ request: allBotsRequest });
    tb.cacheTimes.all = Date.now() - DAY;
    tb._addBot(getBot("foo"));
    tb._addBot(getBot("bar"));
    tb._addUser("baz");

    const bots = await tb.getAllBots();

    t.is(bots.length, 1);
    t.deepEqual(bots, _.values(tb.bots).filter((b) => b.isBot));
    t.false("_links" in bots[0]);
    t.true("baz" in tb.bots);
});

test("Get all bots cached", async (t) => {
    const tb = new TwitchBots({ request });

    tb._addBot(getBot("test"));
    tb._addUser("baz");
    tb.cacheTimes.all = Date.now();

    const bots = await tb.getAllBots();

    t.is(bots.length, 1);
    t.deepEqual(bots, _.values(tb.bots).filter((b) => b.isBot));
});

test("Get all bots by type uncached", async (t) => {
    t.plan(6);
    const type = 1;
    const beforeTS = Date.now();
    const requestBots = (url) => {
        t.is(url, `https://api.twitchbots.info/v1/bot/all?limit=100&type=${type}&offset=0`);

        return Promise.resolve({
            bots: [ getBot("test", type) ],
            _links: {
                self: `https://api.twitchbots.info/v1/bot/all?limit=100&type=${type}&offset=0`,
                next: null,
                prev: null,
                type: `https://api.twitchbots.info/v1/type/${type}`
            },
            offset: 0,
            limit: 100
        });
    };
    const tb = new TwitchBots({ request: requestBots });

    const bots = await tb.getAllBotsByType(type);

    t.is(bots.length, 1);
    t.deepEqual(bots, _.values(tb.bots));
    t.false("_links" in bots[0]);
    t.true(tb.cacheTimes[type] > beforeTS);
    t.true(tb.cacheTimes[type] <= Date.now());
});

test("Get all bots by type expired cache", async (t) => {
    t.plan(5);
    const type = 1;
    const beforeTS = Date.now() - DAY;
    const requestBots = (url) => {
        t.is(url, `https://api.twitchbots.info/v1/bot/all?limit=100&type=${type}&offset=0`);

        return Promise.resolve({
            bots: [ getBot("test", type) ],
            _links: {
                self: `https://api.twitchbots.info/v1/bot/all?limit=100&type=${type}&offset=0`,
                next: null,
                prev: null,
                type: `https://api.twitchbots.info/v1/type/${type}`
            },
            offset: 0,
            limit: 100
        });
    };
    const tb = new TwitchBots({ request: requestBots });
    tb.cacheTimes[type] = beforeTS;

    const bots = await tb.getAllBotsByType(type);

    t.is(bots.length, 1);
    t.false("_links" in bots[0]);
    t.true(tb.cacheTimes[type] > beforeTS);
    t.true(tb.cacheTimes[type] <= Date.now());
});

test("Get all bots by type cached", async (t) => {
    const tb = new TwitchBots({ request });

    tb._addBot(getBot("test", 1));
    tb._addBot(getBot("foo", 1));
    tb._addBot(getBot("bar", 2));

    tb.cacheTimes[1] = Date.now();

    const bots = await tb.getAllBotsByType(1);
    t.is(bots.length, 2);
});
