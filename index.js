import { WebSocketServer } from 'ws';

import {getMessages, getSocketMessages,deleteAllPlayers,instantiatePlayers} from './queries.js';

// import { getMessages } from './queries.js';

// const db = require('./queries');

// import { getMessages } from "./queries";

// import db from "queries";

const wss = new WebSocketServer({ port: 8080 });

var playerEmpty = {id: "",playerNumber: 2 ,headImg: "1",maskedName: "",name: "",initialBalance: 0.0,finalBalance: 0};

var playersArr = [];

var playerCount = 0;

wss.on('connection', function connection(ws,req) {
    console.log(req.headers);
    console.log("CONNECTED");
    var imOpen = false;

    getMessages();

    ws.on('message', function(message) {
        console.log(message);
        
        if(message == "OPEN"){
          console.log("OPEN")
            ws.open()
            return;
        }
        
        if(message == "BET_PHASE"){
          console.log("BET")
            ws.open()
            return;
        }
        
        if(message == "CLOSE"){
            console.log("CLOSE");
            deleteAllPlayers();
            ws.close();
            return;
        }
        
        if(message == "JOIN_ROOM"){
            console.log("JOIN_ROOM");
            wss.broadcast(message);
        }
        
    });
    
    if(playerCount == 0){
        
        setTimeout(() => {
            
          dataSetup();
            
        //   console.log("Delayed for 2 second JOIN_ROOM.");

        instantiatePlayers()
        .then(() => {
          getSocketMessages()
            .then((players) => {
              console.log(players)
              var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "JOIN_ROOM",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
              ws.send(JSON.stringify(obj));
              console.log(JSON.stringify(obj)); 
            })

        });

            //**************BET PHASE****************///
            // setTimeout(() => {
            //   console.log("SEND BET PHASE");

            //   getSocketMessages()
            //   .then((players) => {
            //     console.log(players);
            //     console.log("POSTGRESS DATA");
            //     var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
            //     ws.send(JSON.stringify(obj));

            //     setTimeout(() => {
            //       addPlayerBet(players, 1, function(updatedPlayers, obj) {
            //         players = updatedPlayers;
            //         ws.send(JSON.stringify(obj));
            //       });
            //     }, "4200");

            //     setTimeout(() => {
            //       addPlayerBet(players, 4, function(updatedPlayers, obj) {
            //         players = updatedPlayers;
            //         ws.send(JSON.stringify(obj));
            //       });
            //     }, "4500");

            //     setTimeout(() => {
            //       addPlayerBet(players, 2, function(updatedPlayers, obj) {
            //         players = updatedPlayers;
            //         ws.send(JSON.stringify(obj));
            //       });
            //       addPlayerBet(players, 3, function(updatedPlayers, obj) {
            //         players = updatedPlayers;
            //         ws.send(JSON.stringify(obj));
            //       });
            //     }, "4900");

            //     setTimeout(() => {
            //       var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "CARD_DISTRIBUTION",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
            //       ws.send(JSON.stringify(obj));
            //     }, "24000");
            //   }).catch(console.log);

            // }, "4000");
            
        }, "2500");
        
    }
    
});

function addPlayerBet(players, playerNum, callback) {
  players[playerNum].betfinished = 1;
  players[playerNum].bet = 1103;
  players[playerNum].bets = [50, 50, 1, 1, 1, 500, 500];
  console.log(players);

  var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: "ADD_BET",startTimestamp: 955028233360248,remainingSeconds: 0};
  callback(players, obj);
}

wss.broadcast = function broadcast(msg) {
   var count = 0;
   wss.clients.forEach(function each(client) {
       if(count<1){
          client.send(JSON.stringify(obj));
       }
       count++;
    });
    
};

wss.open = function open() {
   var count = 0;
   wss.clients.forEach(function each(client) {
       client.open();
    });
    
};

wss.close = function close() {
   var count = 0;
   wss.clients.forEach(function each(client) {
       client.close();
    });
    
};

function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function dataSetup() {
    playersArr = [player2,player4,player1,player5,player3];
    console.log("CASE 0");
    // switch(randomIntFromInterval(0, 6)) {
    //    case 0: {
    //        playersArr = [player2,player4,player1,player5,player3];
    //        console.log("CASE 0");
    //       break;
    //    }
    //    case 1: {
    //        playersArr = [player6,player7,player8,player9,player10];
    //        console.log("CASE 1");
    //       break;
    //    }
    //     case 2: {
    //         playersArr = [player11,player12,player13,player14,player15];
    //         console.log("CASE 2");
    //        break;
    //     }
    //     case 3: {
    //         playersArr = [player16,player17,player18,player19,player20];
    //         console.log("CASE 3");
    //         break;
    //     }
    //     case 4: {
    //         playersArr = [player21,player22,player23,player24,player25];
    //         console.log("CASE 4");
    //         break;
    //     }
    //     default: {
    //         playersArr = [player26,player27,player28,player29,player30];
    //         console.log("DEFAULT");
    //        break;
    //     }

    // }
}



var player1 = {pid: "10021",playernumber: 3,headimage: "5",maskedname: "[10021]***021",pname: "[10021]10021",initialbalance: 50000,finalbalance: 0,betfinished:0,bets:[0,0]};
var player2 = {pid: "******090",playernumber: 4,headimage: "4",maskedname: "[语堂]***087",pname: "[语堂]LBG_BOT_509523087",initialbalance: 18940.7,finalbalance: 0,betfinished:0,bets:[0]};
var player3 = {pid: "LBG_BOT_789235980",playernumber: 5,headimage: "3",maskedname: "[聪健]***980",pname: "[聪健]LBG_BOT_789235980",initialbalance: 6892.83,finalbalance: 0,betfinished:0,bets:[0]};
var player4 = {pid: "&&&&3332",playernumber: 1,headimage: "2",maskedname: "[琪]***659",pname: "[琪]LBG_BOT_662212659",initialbalance: 62252.43,finalbalance: 0,betfinished:0,bets:[0]};
var player5 = {pid: "LBG_BOT_662248832",playernumber: 2,headimage: "1",maskedname: "[琪]***832",pname: "[琪]LBG_BOT_662248832",initialbalance: 84657.01,finalbalance: 0,betfinished:0,bets:[0]};

// var player6 = {pid: "10021",playerNumber: 1,headImg: "5",maskedName: "[10021]***021",name: "[10021]10021",initialBalance: 50000,finalBalance: 0,betFinished:0,bets:[0,0]};
// var player7 = {pid: "LBG_BOT_509523087",playerNumber: 2,headImg: "4",maskedName: "[语堂]***087",name: "[语堂]LBG_BOT_509523087",initialBalance: 18940.7,finalBalance: 0,betFinished:0,bets:[0]};
// var player8 = {pid: "LBG_BOT_789235980",playerNumber: 3,headImg: "3",maskedName: "[聪健]***980",name: "[聪健]LBG_BOT_789235980",initialBalance: 6892.83,finalBalance: 0,betFinished:0,bets:[0]};
// var player9 = {pid: "LBG_BOT_662212659",playerNumber: 4,headImg: "2",maskedName: "[琪]***659",name: "[琪]LBG_BOT_662212659",initialBalance: 62252.43,finalBalance: 0,betFinished:0,bets:[0]};
// var player10 = {pid: "LBG_BOT_662248832",playerNumber: 5,headImg: "1",maskedName: "[琪]***832",name: "[琪]LBG_BOT_662248832",initialBalance: 84657.01,finalBalance: 0,betFinished:0,bets:[0]};

// var player11 = {pid: "10021",playerNumber: 2,headImg: "5",maskedName: "[10021]***021",name: "[10021]10021",initialBalance: 50000,finalBalance: 0,betFinished:0,bets:[0,0]};
// var player12 = {pid: "LBG_BOT_509523087",playerNumber: 3,headImg: "4",maskedName: "[语堂]***087",name: "[语堂]LBG_BOT_509523087",initialBalance: 18940.7,finalBalance: 0,betFinished:0,bets:[0]};
// var player13 = {pid: "LBG_BOT_789235980",playerNumber: 4,headImg: "3",maskedName: "[聪健]***980",name: "[聪健]LBG_BOT_789235980",initialBalance: 6892.83,finalBalance: 0,betFinished:0,bets:[0]};
// var player14 = {pid: "LBG_BOT_662212659",playerNumber: 5,headImg: "2",maskedName: "[琪]***659",name: "[琪]LBG_BOT_662212659",initialBalance: 62252.43,finalBalance: 0,betFinished:0,bets:[0]};
// var player15 = {pid: "LBG_BOT_662248832",playerNumber: 1,headImg: "1",maskedName: "[琪]***832",name: "[琪]LBG_BOT_662248832",initialBalance: 84657.01,finalBalance: 0,betFinished:0,bets:[0]};

// var player16 = {pid: "10021",playerNumber: 5,headImg: "5",maskedName: "[10021]***021",name: "[10021]10021",initialBalance: 50000,finalBalance: 0,betFinished:0,bets:[0,2]};
// var player17 = {pid: "LBG_BOT_509523087",playerNumber: 4,headImg: "4",maskedName: "[语堂]***087",name: "[语堂]LBG_BOT_509523087",initialBalance: 18940.7,finalBalance: 0,betFinished:0,bets:[0]};
// var player18 = {pid: "LBG_BOT_789235980",playerNumber: 3,headImg: "3",maskedName: "[聪健]***980",name: "[聪健]LBG_BOT_789235980",initialBalance: 6892.83,finalBalance: 0,betFinished:0,bets:[0]};
// var player19 = {pid: "LBG_BOT_662212659",playerNumber: 2,headImg: "2",maskedName: "[琪]***659",name: "[琪]LBG_BOT_662212659",initialBalance: 62252.43,finalBalance: 0,betFinished:0,bets:[0]};
// var player20 = {pid: "LBG_BOT_662248832",playerNumber: 1,headImg: "1",maskedName: "[琪]***832",name: "[琪]LBG_BOT_662248832",initialBalance: 84657.01,finalBalance: 0,betFinished:0,bets:[0]};


// var player21 = {pid: "10021",playerNumber: 4,headImg: "5",maskedName: "[10021]***021",name: "[10021]10021",initialBalance: 50000,finalBalance: 0,betFinished:0,bets:[0,2]};
// var player22 = {pid: "LBG_BOT_509523087",playerNumber: 5,headImg: "4",maskedName: "[语堂]***087",name: "[语堂]LBG_BOT_509523087",initialBalance: 18940.7,finalBalance: 0,betFinished:0,bets:[0]};
// var player23 = {pid: "",playerNumber: 1,headImg: "3",maskedName: "[聪健]***980",name: "[聪健]LBG_BOT_789235980",initialBalance: 6892.83,finalBalance: 0,betFinished:0,bets:[0]};
// var player24 = {pid: "LBG_BOT_662212659",playerNumber: 2,headImg: "2",maskedName: "[琪]***659",name: "[琪]LBG_BOT_662212659",initialBalance: 62252.43,finalBalance: 0,betFinished:0,bets:[0]};
// var player25 = {pid: "",playerNumber: 3,headImg: "1",maskedName: "[琪]***832",name: "[琪]LBG_BOT_662248832",initialBalance: 84657.01,finalBalance: 0,betFinished:0,bets:[0]};


// var player26 = {pid: "10021",playerNumber: 4,headImg: "5",maskedName: "[10021]***021",name: "[10021]10021",initialBalance: 50000,finalBalance: 0,betFinished:0,bets:[0,2]};
// var player27 = {pid: "LBG_BOT_509523087",playerNumber: 5,headImg: "4",maskedName: "[语堂]***087",name: "[语堂]LBG_BOT_509523087",initialBalance: 18940.7,finalBalance: 0,betFinished:0,bets:[0]};
// var player28 = {pid: "",playerNumber: 1,headImg: "3",maskedName: "[聪健]***980",name: "[聪健]LBG_BOT_789235980",initialBalance: 6892.83,finalBalance: 0,betFinished:0,bets:[0]};
// var player29 = {pid: "",playerNumber: 2,headImg: "2",maskedName: "[琪]***659",name: "[琪]LBG_BOT_662212659",initialBalance: 62252.43,finalBalance: 0,betFinished:0,bets:[0]};
// var player30 = {pid: "LBG_BOT_662248832",playerNumber: 3,headImg: "1",maskedName: "[琪]***832",name: "[琪]LBG_BOT_662248832",initialBalance: 84657.01,finalBalance: 0,betFinished:0,bets:[0]};
