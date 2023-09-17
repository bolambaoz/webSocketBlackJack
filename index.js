import { WebSocketServer } from 'ws';
import { CronJob } from 'cron';

import {
  getMessages, 
  getSocketMessages,
  deleteAllPlayers,
  instantiatePlayers,
  addBet,
  addBetOnOtherSlot,
  finishedBet
} from './queries.js';

var job = new CronJob(
    '* * * * * *',
    function() {
        console.log('Cron');
        bettingPhase()
    },
    null,
    false,
    'America/Los_Angeles'
);

const wss = new WebSocketServer({ port: 8080 });
var playerCount = 0;
var webSocketConnection;
let nIntervId;
var betPhaseTime = 0;
var isOtherBotFinishBet = false;
var isJobStart = false;

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
          resetBetPhase();
          ws.close();
          return;
        } 
        if(DATA.ACTION == "BET_PHASE"){
          console.log("BET")
            ws.open()
            return;
        }
        if(DATA.ACTION == "FINISHED_BET"){
          console.log("FINISHED_BET")
          finishedBet(DATA.data,DATA.data.betfinished)
          .then(()=>{
            console.log("FINISHED_BET PLAYER");
            checkPlayerDoneBetting();

          }).catch(console.log("ADDBET"));
            return;
        }
 /*****************ADDBET SLOTS*******************/
        if(DATA.ACTION == "ADDBET"){
          console.log("ADDBET")
          console.log(DATA.data.pid)
          console.log(DATA.data.bet)
          addBet(DATA.data,DATA.data.bet,false)
          .then(()=>{
            console.log("ADDBET");
            checkPlayerDoneBetting();

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
                resetBetPhase()
                var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "JOIN_ROOM",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                ws.send(JSON.stringify(obj));
                console.log(JSON.stringify(obj)); 
              })
            }, "1000");
        });

            //**************BET PHASE****************///
            setTimeout(()=>{

              console.log("SEND BET PHASE");

              if (!isJobStart) {
                  getSocketMessages()
                  .then((players) => {
                    console.log("POSTGRESS DATA");
                    var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
                    ws.send(JSON.stringify(obj));

                  }).catch(console.log);

                  isJobStart = true;
                  job.start()
              }

            }, "2600")
            
        }, "2000");
        
    }
    
});
function resetBetPhase(){
  clearInterval(nIntervId);
  nIntervId = null;
  betPhaseTime = 0;
  isOtherBotFinishBet = false;
  isJobStart = false;
  job.stop();
}
function bettingPhase() {
  console.log(`bet time is: ${betPhaseTime}`)
  
  if(betPhaseTime >= 24){
    resetBetPhase()
    return;
  }

  if(betPhaseTime <= 5){
    addOtherPlayer();
  }
 betPhaseTime++;
}
function checkPlayerDoneBetting(){
    getSocketMessages()
    .then((players) => {
      var playersFiltered =  players.filter(player => (player.pid !== ""))
      var isFinishedBets = players.filter(player => ((player.pid !== "" || player.pid === "10021") && player.betfinished))

      var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players},gamePhase: "BET_PHASE",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
      webSocketConnection.send(JSON.stringify(obj));

      if(playersFiltered.length === isFinishedBets.length){
        console.log("FINISHED ALL BET")
        resetBetPhase()
        var obj = {code: 4000,data: {roomId: "4655c70e7a74482d9357aac87b820774Diqb3q1sXG",players:players,bankercards:["poker_7H","poker_3D"]},gamePhase: "CARD_DISTRIBUTION",playerChoice: null,startTimestamp: 955028233360248,remainingSeconds: 0};
        webSocketConnection.send(JSON.stringify(obj));
        return
      }
    }).catch(console.log);
}
function addOtherPlayer(){
  console.log("ADDING OTHER PLAYER BETS")

  if(!isOtherBotFinishBet){
        getSocketMessages()
        .then((players) => {
          var playerHasNoBet =  players.filter(player => (player.pid !== "" && (player.bets.length-1) === 0 && player.pid !== "10021"))

          if(playerHasNoBet.length === 0){
            isOtherBotFinishBet = true;
              return;
          }
          
          if(playerHasNoBet[0].bets.length-1 === 0){
              addBet(playerHasNoBet[0],50,true)
              .then(()=>{
                  checkPlayerDoneBetting();
                  console.log("AddedOtherPlayer");
              }).catch(console.log("ADDBET"));
          }

        }).catch(console.log);
  }

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
