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

var playerAdd = {pid: "LBG_BOT_662212659",playernumber: 2,headimage: "2",maskedname: "[琪]***659",pname: "[琪]LBG_BOT_662212659",initialbalance: 62252.43,finalbalance: 0,betfinished:0,bets:[0]};


wss.on('connection', function connection(ws,req) {
    console.log(req.headers);
    console.log("CONNECTED");
    var imOpen = false;

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
 /*****************ADDBET SLOTS*******************/
        if(DATA.ACTION == "ADDBET"){
          console.log("ADDBET")
          console.log(DATA.data.pid)
          console.log(DATA.data.bet)
          addBet(DATA.data,DATA.data.bet)
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
        if(DATA.ACTION == "BET_PHASE"){
          console.log("BET")
            ws.open()
            return;
        }
        
        if(DATA.ACTION == "CLOSE"){
            console.log("CLOSE");
            ws.close();
            return;
        }
        
        if(DATA.ACTION == "JOIN_ROOM"){
            console.log("JOIN_ROOM");
            wss.broadcast(message);
        }
        
    });
    
    if(playerCount == 0){
        
        setTimeout(() => {
            
        //   console.log("Delayed for 2 second JOIN_ROOM.");

        instantiatePlayers()
        .then(() => {
          getSocketMessages()
            .then((players) => {
              var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "JOIN_ROOM",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
              ws.send(JSON.stringify(obj));
              console.log(JSON.stringify(obj)); 
            })

        });

            //**************BET PHASE****************///
            setTimeout(() => {
              console.log("SEND BET PHASE");

              getSocketMessages()
              .then((players) => {
                console.log("POSTGRESS DATA");
                var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                ws.send(JSON.stringify(obj));

                setTimeout(() => {
                  addBet(playerAdd,50)
                  .then(()=>{
        
                    getSocketMessages()
                    .then((players) => {
                      console.log("OTHER PLAYERS BET");
                      var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                      ws.send(JSON.stringify(obj));
                    }).catch(console.log);
        
                  }).catch(console.log("ADDBET"));
                }, "4500");

                setTimeout(() => {
                  addBet(playerAdd,50)
                  .then(()=>{
        
                    getSocketMessages()
                    .then((players) => {
                      console.log("OTHER PLAYERS BET");
                      var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                      ws.send(JSON.stringify(obj));
                    }).catch(console.log);
        
                  }).catch(console.log("ADDBET"));
                }, "4900");

                // setTimeout(() => {
                //   var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "CARD_DISTRIBUTION",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                //   ws.send(JSON.stringify(obj));
                // }, "24000");

              }).catch(console.log);

            }, "2500");
            
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
