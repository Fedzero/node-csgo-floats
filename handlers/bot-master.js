const EventEmitter    = require('events').EventEmitter;
const Functions       = require('../helpers/functions');
const os              = require('os');
const GlobalOffensive = require('globaloffensive');

class BotMaster extends EventEmitter {
    constructor(options = {}) {
        super();

        const defaults = {
            max_retries: 5,
            retry_first: true
        }

        this.options = Object.assign(defaults, options);
        this._setupDefaults();
    }

    _setupDefaults() {
        this._steamClients  = {};
        this._availableBots = {};
        this._itemQueue     = {};
    }

    _setupBot(accountID) {
        this._availableBots[accountID] = {};

        this._steamClients[accountID].on('disconnected', (eresult, msg) => {
            this.emit('disconnected', {
                accountID: accountID,
                eresult:   eresult,
                msg:       msg
            });

            delete this._steamClients[accountID];
            delete this._availableBots[accountID];
        });

        this._steamClients[accountID].on('error', (error) => {
            this.emit('error', {
                accountID: accountID,
                error:     error
            });

            delete this._steamClients[accountID];
            delete this._availableBots[accountID];
        });

        this._availableBots[accountID] = new GlobalOffensive(this._steamClients[accountID]);
        this._steamClients[accountID].gamesPlayed([730]);

        this._availableBots[accountID].on('connectedToGC', _ => {
            this._availableBots[accountID].available = true;
            this._runQueue();

            this.emit('connectedToGC', accountID);
        });

        this._availableBots[accountID].on('disconnectedFromGC', reason => {
            this._availableBots[accountID].available = false;
            this._runQueue();

            this.emit('disconnectedFromGC', {
                accountID: accountID,
                reason:    reason
            });
        });

        this._availableBots[accountID].on('inspectItemInfo', item => {
            this._handleInspectResponse(accountID, item);
        });
    }

    _handleInspectResponse(accountID, item) {
        const queueItem = this._itemQueue[item.itemid];
        delete this._itemQueue[item.itemid];

        Functions.sleep(1000).then(_ => {
            this._availableBots[accountID].available = true;
            this._runQueue(true);
        });

        queueItem.resolve(item);
    }

    async _runQueue(a) {
        const filteredBots  = Object.keys(this._availableBots).filter(accountID => this._availableBots[accountID].available);
        const filteredItems = Object.keys(this._itemQueue).filter(assetID => !this._itemQueue[assetID].requesting);

        if(!filteredItems.length || !filteredBots.length)
            return;

        const assetID   = Object.keys(this._itemQueue)[0];
        const accountID = filteredBots[0];
        const item      = this._itemQueue[assetID];

        this._itemQueue[assetID].requesting      = true;
        this._availableBots[accountID].available = false;
        this._availableBots[accountID].inspectItem(item.steamID64, assetID, item.ambiguousID);

        Functions.sleep(2000).then(_ => {
            if(!this._itemQueue.hasOwnProperty(assetID))
                return;

            this._itemQueue[assetID].reject('Particular item took too long to resolve');
            this._availableBots[accountID].available = true;

            delete this._itemQueue[assetID];
            this._runQueue();
        });
    }

    inspect(inspectURL) {
        return new Promise((resolve, reject) => {
            const params = Functions.extractInspectURL(inspectURL);

            if(params === null)
                return reject('Invalid inspectURL');

            if(this._itemQueue.hasOwnProperty(params.a))
                return reject('Particular item already in queue');

            this._itemQueue[params.a] = {
                steamID64:   params.s,
                ambiguousID: params.d,
                requesting:  false,
                resolve:     resolve,
                reject:      reject
            };

            Functions.sleep(10000).then(_ => {
                if(!this._itemQueue.hasOwnProperty(params.a))
                    return;

                delete this._itemQueue[params.a];
                reject('Particular item took too long to resolve');

                this._runQueue();
            });

            this._runQueue();
        })
    }

    addBot(steamUser = false) {
        return new Promise((resolve, reject) => {
            if(!steamUser)
                return reject('Missing Steam user');

            if(steamUser.steamID && this._steamClients.hasOwnProperty(steamUser.steamID.accountid))
                return reject('Particular Steam user already added');

            steamUser.loggedIn = steamUser.steamID !== null;

            Functions.sleep(30000).then(_ => {
                if(!steamUser.loggedIn) reject('Steam user took too long to connect');
            });

            if(steamUser.loggedIn) {
                this._steamClients[steamUser.steamID.accountid] = steamUser;
                this._setupBot(steamUser.steamID.accountid);

                return resolve(steamUser.steamID.accountid);
            }

            function removeHandlers() {
                steamUser.removeListener('loggedOn',   logOnHandler);
                steamUser.removeListener('error',      errorHandler);
                steamUser.removeListener('disconnect', disconnectHandler);
            }

            function logOnHandler(details) {
                removeHandlers();

                steamUser.loggedIn = true;
                this._steamClients[steamUser.steamID.accountid] = steamUser;
                this._setupBot(steamUser.steamID.accountid);

                return resolve(steamUser.steamID.accountid);
            }

            function errorHandler(error) {
                removeHandlers();
                steamUser.loggedIn = false;
                return reject(error);
            }

            function disconnectHandler(eresult, msg) {
                removeHandlers();
                steamUser.loggedIn = false;
                return reject(msg || eresult);
            }

            steamUser.on('loggedOn',   logOnHandler.bind(this));
            steamUser.on('error',      errorHandler.bind(this));
            steamUser.on('disconnect', disconnectHandler.bind(this));
        });
    }
}

module.exports = BotMaster;
