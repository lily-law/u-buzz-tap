const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const path = require('path');
const port = process.env.PORT || 5000;
const io = require('socket.io')(http);
const {newSession, requestNSP} = require('./backend/sessions');

app.use(express.static(path.join(__dirname, 'client/build')));

if (process.env.NODE_ENV === 'production') {  
    app.use(express.static(path.join(__dirname, 'client/build')));  
    app.get('*', (req, res) => { res.sendfile(path.join(__dirname = 'client/build/index.html')); })
}
else {
    app.get('*', (req, res) => {  res.sendFile(path.join(__dirname+'/client/public/index.html'));})
}
//build mode

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('nspreq', sessionId => {
        requestNSP(sessionId).then(nsp => {
            console.log('nsp:'+nsp)
            socket.emit('nsp', nsp);
        }, e => console.error(e));
    })
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
});

app.post('/session', jsonParser, function (req, res) {
    console.log(req.body)
    const sessionId = newSession(req.body.data, io);
    console.log(sessionId+' created!')
    res.send(sessionId);
});

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});