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

master.addBot(user).then(accountID => console.log(`Account ${accountID} added to bot master.`)).catch(error => console.log('Error adding bot to bot master.', error));

master.on('error', response => {
    const { accountID, error } = response;
    console.log(`Account ${accountID} disconnected from Steam.`, error);
})

master.on('connectedToGC', accountID => {
    console.log(`Account ${accountID} connected to GC. Testing module.`);

    master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A7854562798D16196779082076798575').then(item => {
        console.log('Working Item 1 (succeeded)', 'float value:', item.paintwear);
    }).catch(error => console.log('Working Item 1 (failed)', error));

    master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A7890581561D352657975109030001').then(item => {
        console.log('Working Item 2 (succeeded)', 'float value:', item.paintwear);
    }).catch(error => console.log('Working Item 2 (failed)', error));

    master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A7854562798D16196779082076798575').then(item => {
        console.log('Non-Working Item 1 (succeeded)', 'float value:', item.paintwear);
    }).catch(error => console.log('Non-Working Item 3 (failed)', error));

    master.inspect('steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198264168745A2890581561D35265797510903000').then(item => {
        console.log('Non-Working Item 2 (succeeded)', 'float value:', item.paintwear);
    }).catch(error => console.log('Non-Working Item 4 (failed)', error));
});

master.on('disconnectedFromGC', response => {
    const { accountID, error } = response;
    console.log(`Account ${accountID} disconnected from GC.`, error);
});
