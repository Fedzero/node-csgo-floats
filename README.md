# CSGO Floats
### This is an abstraction layer written upon node-steam-user for obtaining an item's attributes such as its paintwear, paintseed and paintindex
[![npm version](https://img.shields.io/npm/v/csgo-floats.svg)](https://npmjs.com/package/csgo-floats)
[![npm downloads](https://img.shields.io/npm/dm/csgo-floats.svg)](https://npmjs.com/package/csgo-floats)
[![dependencies](https://img.shields.io/david/Kondax/node-csgo-floats.svg)](https://david-dm.org/DoctorMcKay/node-csgo-floats)
[![license](https://img.shields.io/npm/l/csgo-floats.svg)](https://github.com/Kondax/node-csgo-floats/blob/master/LICENSE)

CSGO Floats (despite the name) is an abstraction layer written upon [node-steam-user SteamUser](https://github.com/DoctorMcKay/node-steam-user). It allows you to pass in multiple [node-steam-user SteamUser](https://github.com/DoctorMcKay/node-steam-user) instances. It rotates between these instances to fetch item data about any inspect url you pass to it.

**Any accounts used with this module must have CSGO installed to function correctly. Any items added to the queue that are not resolved within 15 seconds will fail. Most items are resolved instantly.**

Steam limits item resolves to one request per second. If you run one bot, only one item will be resolved per second. If you run four bots, four items will be resolved per second.
**This module handles waiting between item resolves.**

# Contents
- [Methods](#methods-)
- [Events](#events-)
- [Example](#example-)

# Methods [^](#contents)

### Constructor()

Constructs a new `BotMaster`. This class handles the bots and resolving items.

### addBot(steamUser)
- `steamUser` - A `SteamUser` `Object` that can either be connected to Steam or will be connected to Steam.

This method accepts a `SteamUser` `Object` that is either logged into steam or will be logged into steam.
Returns a promise. It will resolve with the accountID if the account is successfully added to the `BotMaster`. It will reject if the account has already been added, is not logged in within 30 seconds or throws an error.

Example:
```js
const botMaster = require('csgo-floats');
const master    = new botMaster();

let user = new steamUser();
user.logOn({
    accountName: 'dummyAccountName',
    password:    'dummyAccountPassword',
    twoFactorCode: steamTotp.generateAuthCode('dummyAccountSharedSecret')
});

master.addBot(user).then(accountID => {
    console.log(`Account ${accountID} added to bot master.`)
}).catch(error => {
    console.log('Error adding bot to bot master.', error)
});
```

### inspect(inspectURL)
- `inspectURL` - The `inspectURL` string of the item you wish to resolve. This must be the full `inspectURL`.

This method accept an `inspectURL` string.
Returns a promise. It will resolve with the item data. It will reject if the item is not resolved within 15 seconds, is an invalid inspect url or the item is already in the queue.

Example:
```js
master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A7854562798D16196779082076798575').then(item => {
    console.log(`Float value of item is ${item.paintwear}`);
}).catch(error => console.log('Error resolving item.', error));
```

### Example

This example will log a user in. Once the user is logged in it will request an `inspectURL` to be resolved.
This example does not account for errors logging into the account or connecting to the GC.

```js
const steamUser = require('steam-user');
const steamTotp = require('steam-totp');

const botMaster = require('./index.js');
const master    = new botMaster();

let user = new steamUser();
user.logOn({
    accountName: 'dummyAccountName',
    password:    'dummyAccountPassword',
    twoFactorCode: steamTotp.generateAuthCode('dummyAccountSharedSecret')
});

master.addBot(user); /* You can add multiple bots. It will rotate between them */

master.on('connectedToGC', accountID => {
    master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A7854562798D16196779082076798575').then(item => {
        console.log(`Float value of item is ${item.paintwear}`);
    }).catch(error => console.log('Error resolving item.', error));
});
```

# Events [^](#contents)

## Object Events

Events marked as **Object events** emit an `Object`. This `Object` can be deconstructed to access the emitted variables as variables as opposed to `Object` properties.

Example:

```js
master.on('disconnectedFromGC', response => {
    const { accountID, error } = response;
    console.log(`Account ${accountID} disconnected from GC.`, error);
});
```

The above example is an [Object Event](#object-events). The `BotMaster` emits an `Object` in response to a disconnect from the GC. This `Object` contains two properties - `accountID` and `error`. In the example, the object is deconstructed into two variables `accountID` and `error`.

### disconnected
- `accountID` - The `accountID` of the bot that the event is emitted from.
- `eresult` - The `eresult` returned by Steam.
- `msg` - The `msg`, _sometimes undefined_, as to why the disconnect occurred. Emitted by Steam.

*This is an [Object Event](#object-events).*
_This is not directly related the the GC._

Emitted when Steam disconnects the bot from the Steam Network.

### error
- `accountID` - The `accountID` of the bot that the event is emitted from.
- `error` - The `error` that is emitted by Steam.

*This is an [Object Event](#object-events).*
_This is not directly related the the GC._

Emitted when Steam emits an error.

### connectedToGC
- `accountID` - The `accountID` of the bot that the event is emitted from.

Emitted when Steam connects to the GC. Use this method to know when you can start requesting to resolve items.

### disconnectedFromGC
- `accountID` - The `accountID` of the bot that the event is emitted from.
- `reason` - The `reason` as to why the bot was disconnected from the GC. Emitted by Steam.

*This is an [Object Event](#object-events).*

Emitted when Steam is disconnected from the GC.

# Example [^](#contents)

The example is located at https://github.com/Kondax/node-csgo-floats/blob/master/example.js
It will request the floats for four items.

**Two requests should succeed. Two should fail**

One request should resolve instantly. The other request should resolve a second after the first.
One request should fail as it's a duplicate request (same item) as the first. The other request should fail as it's an invalid item.
