import { WebSocketServer } from 'ws';

import {
  getMessages, 
  getSocketMessages,
  deleteAllPlayers,
  instantiatePlayers,
  addBet,
  addBetOnOtherSlot
} from './queries.js';

const wss = new WebSocketServer({ port: 8080 });
var playerCount = 0;
var webSocketConnection;
let nIntervId;

wss.on('connection', function connection(ws,req) {
    console.log(req.headers);
    console.log("CONNECTED");
    webSocketConnection = ws

    deleteAllPlayers();
    getMessages();

    ws.on('message', function(message) {
        console.log(`${message}`);
        var DATA = JSON.parse(message);

        if(DATA.ACTION == "OPEN"){
          console.log("OPEN")
            ws.open()
            return;
        }
        if(DATA.ACTION == "JOIN_ROOM"){
          console.log("JOIN_ROOM");
          wss.broadcast(message);
        }
        if(DATA.ACTION == "CLOSE"){
          console.log("CLOSE");
          deleteAllPlayers();
          clearInterval(nIntervId);
          nIntervId = null;
          ws.close();
          return;
        } 
        if(DATA.ACTION == "BET_PHASE"){
          console.log("BET")
            ws.open()
            return;
        }
        if(DATA.ACTION == "FINISHED_BET"){
          console.log("BET")
            ws.open()
            return;
        }
 /*****************ADDBET SLOTS*******************/
        if(DATA.ACTION == "ADDBET"){
          console.log("ADDBET")
          console.log(DATA.data.pid)
          console.log(DATA.data.bet)
          addBet(DATA.data,DATA.data.bet,false)
          .then(()=>{

            getSocketMessages()
            .then((players) => {
              console.log("ADDBET");
              var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
              ws.send(JSON.stringify(obj));
            }).catch(console.log);

          }).catch(console.log("ADDBET"));

            return;
        }
 /*****************ADDBET SLOTS ENDS*******************/

  /*****************OTHER SLOTS*******************/
        if(DATA.ACTION == "ADDBETOTHERSLOT"){
          console.log("ADDBETOTHERSLOT")
          console.log(DATA.data.playernumber)
          console.log(DATA.data.bet)
          addBetOnOtherSlot(DATA.data,DATA.data.bet)
          .then(()=>{

            getSocketMessages()
            .then((players) => {
              console.log(players)
              console.log("MESSAGE__ADDBETOTHERSLOT");
              var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
              ws.send(JSON.stringify(obj));
            }).catch(console.log);

          }).catch(console.log("ERROR___ADDBETOTHERSLOT"));

            return;
        }
 /*****************OTHER SLOTS ENDS*******************/

 /*****************CARD_DISTRIBUTION*******************/
   if(DATA.ACTION == "CARD_DISTRIBUTION"){
      console.log("CARD_DISTRIBUTION")
      return;
  }
/*****************CARD_DISTRIBUTION*******************/
        
    });
    
    if(playerCount == 0){
        
        setTimeout(() => { 
        //   console.log("Delayed for 2 second JOIN_ROOM.");
        instantiatePlayers()
        .then(() => { 
            setTimeout(() => {
              getSocketMessages()
              .then((players) => {
                var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "JOIN_ROOM",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                ws.send(JSON.stringify(obj));
                console.log(JSON.stringify(obj)); 
              })
            }, "1000");
        });

            //**************BET PHASE****************///
            setTimeout(()=>{

              console.log("SEND BET PHASE");
              getSocketMessages()
              .then((players) => {
                console.log("POSTGRESS DATA");
                var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                ws.send(JSON.stringify(obj));

                setTimeout(()=>{
                  bettingPhase()
                }, "2000")

              }).catch(console.log);

            }, "2600")
            
        }, "2500");
        
    }
    
});
function bettingPhase() {
  if (!nIntervId) {
    nIntervId = setInterval(addOtherPlayer, 1000);
  }
}

function addOtherPlayer(){
  console.log("ADDING OTHER PLAYER BETS")
    getSocketMessages()
    .then((players) => {
       var playerHasNoBet =  players.filter(player => (player.pid !== "" && (player.bets.length-1) === 0 && player.pid !== "10021"))

       if(playerHasNoBet.length === 0){
          clearInterval(nIntervId);
          nIntervId = null;
          return;
       }
       
       if(playerHasNoBet[0].bets.length-1 === 0){
          addBet(playerHasNoBet[0],50,true)
          .then(()=>{
              getSocketMessages()
                .then((players) => {
                  console.log("AddedOtherPlayer");
                  var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                  webSocketConnection.send(JSON.stringify(obj));
                }).catch(console.log);
          }).catch(console.log("ADDBET"));
       }

    }).catch(console.log);
}

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
