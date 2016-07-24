# twitchbots-base
[![Build Status](https://travis-ci.org/freaktechnik/twitchbots-base.svg?branch=master)](https://travis-ci.org/freaktechnik/twitchbots-base) [![codecov](https://codecov.io/gh/freaktechnik/twitchbots-base/branch/master/graph/badge.svg)](https://codecov.io/gh/freaktechnik/twitchbots-base) [![Dependency Status](https://dependencyci.com/github/freaktechnik/twitchbots-base/badge)](https://dependencyci.com/github/freaktechnik/twitchbots-base)

This is a base-module for using the [twitchbots.info](https://twitchbots.info)
API with JS. It requires a request function to be passed in. For modules with a
request method built in, see
[jetpack-twitchbots](https://www.npmjs.com/package/jetpack-twitchbots) and
[twitchbots-node](https://www.npmjs.com/package/twitchbots-node).

## Usage
To instantiate, construct the global export of the module, with one argument,
an object of the following form:
```js
{
    request: function(url) {
        return new Promise(function(resolve, reject) {
            //TODO make request. Resolve with parsed JSON on 200 status code,
            // else reject with an error that has a "code" attribute with the
            // error code.
        });
    }
}
```

## Methods
All methods resolve to promises.
The return values are explained later on.

 - `getBot(username)`: Bot
 - `getBots(usernames)`: array<Bot>
 - `getAllBots()`: array<Bot> (returns only true bots)
 - `getAllBotsByType(typeId)`: array<Bot> (returns only true bots)
 - `getType(typeId)`: Type

## Return Values
### Bot
An object with the following properties:
 - `isBot`: boolean
 - `username`: string
 - `type`: typeId (number)

### Type
An object with the following properties:
 - `id`: typeId (number)
 - `name`: string
 - `multiChannel`: boolean
 - `url`: string

## License
This project is licensed under the MIT License.
