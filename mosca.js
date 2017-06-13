var mongoose = require('mongoose')
var mongoUrl = 'mongodb://pdthang:Thangphan90@10.99.0.11:27017/admin'
//var mongoUrl = 'mongodb://pdthang:Thangphan90@mongo.plugplay.co:27017/admin'

// Refer issue to config setting
// https://github.com/mcollina/mosca/issues/212
// https://github.com/mcollina/ascoltatori/blob/master/lib/mongo_ascoltatore.js#53
var ascoltatore = {
  // using ascoltatore
    type: 'mongo',
    url: mongoUrl,
    size: 100 * 1024 * 1024 * 1024, // 100 GB
    max: 5000 * 10000, // documents
    pubsubCollection: 'mqtts',
    mongo: {}
}


// - 1883 port for MQTT
// - 8883 port for MQTT(SSL)
// - 8083 for WebSocket/HTTP
// - 8084 for WSS/HTTPS
var settings = {
    backend: ascoltatore,
    allowNonSecure: true, // Enable Secure and NonSecure
    port: 1883, // For MQTT
	secure : {
    	port: 8883, // For MQTT(SSL)
    	keyPath: 'ssl-privkey-key.pem',
    	certPath: 'ssl-fullchain-cert.pem',
  	},
    http:{
        port: 8083, // For WebSocket/HTTP
        bundle: true,
        static: './'
    },
    https: { // For WSS/HTTPS
        port: 8084,
        bundle: true,
        static: './'
    }
}

var authenticate = function (client, user_key, board_id, callback) {
    var authorized = false

    mongoose.connection.db.collection('users', function (err, collection) {
    collection.find({'userKey': String(user_key)}).toArray(function (err, results) {
            if (results.length == 0) {
                callback(null, authorized)
            }
        })
    })

    mongoose.connection.db.collection('boards', function (err, collection) {
        collection.find({'boardId': String(board_id)}).toArray(function (err, results) {
            if (results.length) {
                authorized = true
                client.key = board_id
            }
            callback(null, authorized)
        })
    })
}

// we refer format : board_id/topic
var authorizePublish = function (client, topic, payload, callback) {
    callback(null, client.key == topic.split('/')[0])
}

// we refer format : board_id/topic
var authorizeSubscribe = function (client, topic, callback) {
    callback(null, client.key == topic.split('/')[0])
}

// var http     = require('http'), 
//   httpServ = http.createServer()
var mosca = require('mosca'),
    server = new mosca.Server(settings)

// server.attachHttpServer(httpServ)

// httpServ.listen(9001)    

server.on('clientConnected', function (client) {
    console.log('client connected', client.id)
})

// fired when a message is received
server.on('published', function (packet, client) {
    console.log('Published', packet.payload)
})

server.on('ready', setup)

// fired when the mqtt server is ready
function setup () {
    mongoose.connect(mongoUrl)
    server.authenticate = authenticate
    server.authorizePublish = authorizePublish
    server.authorizeSubscribe = authorizeSubscribe
    console.log('Mosca server is up and running')
}

/*
// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  var authorized = (username === 'alice' && password.toString() === 'secret')
  if (authorized) client.user = username
  callback(null, authorized)
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
  callback(null, client.user == topic.split('/')[1])
}

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  callback(null, client.user == topic.split('/')[1])
}

var server = new mosca.Server(settings)
server.on('ready', setup)

function setup() {
  server.authenticate = authenticate
  server.authorizePublish = authorizePublish
  server.authorizeSubscribe = authorizeSubscribe
}
*/
