const {v4: uuidv4} = require("uuid");
const Player = require('./Player');

function Session(title, io, token) {
    this.title = title;
    this.players = {};
    this.entered = [];
    this.nspToken = token || uuidv4();
    this.nsp = io.of('/'+this.nspToken);
    this.syncStart = null;
    this.syncCount = 0;
    this.nsp.on('connection', (socket) => {
        this.players[socket.id] = new Player(socket, this);
        if (this.selfTimeOut) {
            clearTimeout(this.selfTimeOut);
        }
        socket.on('disconnect', () => {
            delete this.players[socket.id];
            const players = this.getPlayers();
            if (players.length > 0) {
                this.nsp.emit('players', players);
            }
            else {
                this.selfTimeOut = setTimeout(() => {
                    this.dieIfInactive();
                }, 1000*60*15);
            }
        });
        socket.on('sync', () => {
            if (this.syncCount >= Object.keys(this.players).length - 1) {
                setTimeout(this.resolveBuzz, 100); // TODO refactor so player offset resolves as promise
            }
        });
    });
    this.dieIfInactive = this.dieIfInactive.bind(this);
    this.getPlayers = this.getPlayers.bind(this);
    this.resolveBuzz = this.resolveBuzz.bind(this);
}
Session.prototype.getPlayers = function() {
    return Object.values(this.players).map(({userData}) => ({...userData}));
}
Session.prototype.buzz = function() {
    if (!this.syncStart) {
        this.sync();
    }
}
Session.prototype.resolveBuzz = function() {
    if (this.syncStart) {
        const buzzedIn = {}; 
        this.syncStart = null;
        const buzzedArr = Object.values(this.players).map((p) => ({...p.userData, buzzed: p.userData.buzzed ? p.userData.buzzed+p.offset : null})).filter(({buzzed}) => buzzed).sort((a, b) => a.buzzed - b.buzzed);
        if (buzzedArr.length === 0) {
            this.nsp.emit('nextRound', 0);
        }
        const winningTime = buzzedArr[0].buzzed;
        buzzedArr.forEach(({buzzed, id}) => {
            buzzedIn[id] = buzzed - winningTime;
        });
        this.nsp.emit('buzzedInList', buzzedIn);
        this.nsp.emit('nextRound', 5000);
        Object.keys(this.players).forEach(player => {
            this.players[player].userData.buzzed = null;
        });
    }
    else {
        this.nsp.emit('nextRound', 0);
    }
}
Session.prototype.sync = function() {
    this.nsp.emit('sync', '');
    this.syncStart = Date.now();
    console.log(this.syncStart)
    this.syncCount = 0;
    setTimeout(() => {
        this.syncStart && this.resolveBuzz();
    }, 3000);
}
Session.prototype.dieIfInactive = function() {
    console.log('Dying if no players...');
    if (this.nspToken && Object.keys(this.players).length <= 0) {
        this.entered.forEach(socket => socket && socket.disconnect());
        this.killSelf();
    }
}

module.exports = Session;