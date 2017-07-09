import test from 'ava';
import TwitchBots from '../';

const DAY = 60 * 60 * 1000 * 24;
const WEEK = DAY * 7;
const request = (url) => Promise.reject(url);

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

test("Expired request expired", (t) => {
    const timestamp = Date.now() - DAY;
    const tb = new TwitchBots({ request });

    tb.cacheTimes.all = timestamp;

    t.true(tb.isRequestExpired("all"));
});

test("Not expired request expired", (t) => {
    const timestamp = Date.now() - DAY + 10000;
    const tb = new TwitchBots({ request });

    tb.cacheTimes.all = timestamp;
    tb.cacheTimes[0] = Date.now();

    t.false(tb.isRequestExpired("all"));
    t.false(tb.isRequestExpired(0));
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

test("Has valid valid request", (t) => {
    const tb = new TwitchBots({ request });

    tb.cacheTimes.all = Date.now();

    t.true(tb.hasValidCachedRequest("all"));
});

test("Not has valid cached request", (t) => {
    const tb = new TwitchBots({ request });

    t.false(tb.hasValidCachedRequest("all"));
});

test("Expired request is not valid", (t) => {
    const timestamp = Date.now() - DAY;
    const tb = new TwitchBots({ request });

    tb.cacheTimes.all = timestamp;

    t.false(tb.hasValidCachedRequest("all"));
});
