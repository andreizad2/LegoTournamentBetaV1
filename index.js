const http = require("http");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.get("/admin", (req,res)=> res.sendFile(__dirname + "/admin.html"))

app.listen(9091, ()=>console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};
let answerFlag = false; //This flag is to let the front end know when to add the teams to leaderboard.

const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //I have received a message from the client
        //a user want to create a new game
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                // "balls": 20,
                "startGame": false,
                "clients": [],
                "leaderBoard": []
            }

            const payLoad = {
                "method": "create",
                "game" : games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //a client want to join
        if (result.method === "join") {

            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            //Start Game flag is enabled.
            console.log("I got here 1")
            if (game.startGame || game.clients.length === 12) 
            {
                //sorry max players reach
                console.log("Sorry, maximum players of: " + game.clients.length + " has been reached.")
                return;
            }
            console.log("I got here 2")
            const color =  {"0": "Red", "1": "Green", "2": "Blue","3": "Yellow", "4": "Purple", "5": "Lime","6": "Aqua", "7": "Gray", "8": "Cyan","9": "Steel Blue", "10": "Magenta", "11": "Pink"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })
            //start the game
            console.log("Game Start Status: " + game.startGame)

            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const game = games[gameId]; //Added this so I can add to leaderBoard
            const buttonId = result.buttonId;
            const color = result.color;
            let state = games[gameId].state;
            console.log("I got right before state")
            if (!state)
                state = {}
            state[buttonId] = color;
            games[gameId].state = state;
            console.log("I got right before leaderboard")
            if (!game.leaderBoard.includes(buttonId))
                game.leaderBoard.push(buttonId)
                answerFlag = "True"
                console.log("Leaderboard Length: " + game.leaderBoard.length)

        }
        if (result.method === "start") {
            const gameId = result.gameId;
            const game = games[gameId];
            let start = games[gameId].startGame;

            if (!start)
                start = {}
            start = true;
            console.log("Game has been started " + start);
            updateGameState(); //Start game may be the culprit here
            return;
        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})


function updateGameState(){

    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game,
            "answerFlag": answerFlag
        }

        game.clients.forEach(c=> {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
            answerFlag = "False" //This flag is to let the front end know when to add the teams to leaderboard.
        })
    }

    setTimeout(updateGameState, 500);
}



// function S4() {
//     return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
// }

// // then to call it, plus stitch in '4' in the third group
// const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
//Created random 6 digit numerical ID for game.
function generateRandomNumber() {
    var minm = 100000;
    var maxm = 999999;
    return Math.floor(Math
    .random() * (maxm - minm + 1)) + minm;
}
const guid = () => generateRandomNumber();