// const Pool = require("pg").Pool;
import pg from 'pg';
const Pool = pg.Pool;

let player1 = {pid: "10021",playernumber: 3,headimage: "5",maskedname: "[10021]***021",pname: "[10021]10021",initialbalance: 50000,finalbalance: 0,betfinished:0,bets:[0,0]};
let player2 = {pid: "******090",playernumber: 4,headimage: "4",maskedname: "[语堂]***087",pname: "[语堂]LBG_BOT_509523087",initialbalance: 18940.7,finalbalance: 0,betfinished:0,bets:[0]};
let player3 = {pid: "LBG_BOT_789235980",playernumber: 5,headimage: "3",maskedname: "[聪健]***980",pname: "[聪健]LBG_BOT_789235980",initialbalance: 6892.83,finalbalance: 0,betfinished:0,bets:[0]};
let player4 = {pid: "&&&&3332",playernumber: 1,headimage: "2",maskedname: "[琪]***659",pname: "[琪]LBG_BOT_662212659",initialbalance: 62252.43,finalbalance: 0,betfinished:0,bets:[0]};
let player5 = {pid: "LBG_BOT_662248832",playernumber: 2,headimage: "1",maskedname: "[琪]***832",pname: "[琪]LBG_BOT_662248832",initialbalance: 84657.01,finalbalance: 0,betfinished:0,bets:[0]};

var playersArr = [player2,player4,player1,player5,player3];

const pool = new Pool({
     user: "me",
     host: "localhost",
     database: "api",
     password: "password",
     port: 5432,
});

const getMessages = (request, response) => {
   pool.query(
      "SELECT * FROM players",
      (error, results) => {
         if (error) {
            throw error;
         }
         // console.log(results.rows);
      }
   );
};

const getSocketMessages = () => {
   return new Promise((resolve) => {
      pool.query(
         "SELECT * FROM players",
         (error, results) => {
            if (error) {
               throw error;
            }
            resolve(results.rows);
          }
      );
   });
};

const deleteAllPlayers = () =>{
   pool.query(
      "DELETE FROM players",
      (error, results) => {
         if (error) {
            throw error;
         }
         console.log("Players Deleted");
      }
   );
}

const instantiatePlayers = () => {
   return new Promise((resolve) => {
      playersArr.forEach( (p, i) => {
            pool.query(
               "INSERT INTO players (pid, playernumber,headimg,maskedname,pname,initialbalance,finalbalance,betfinished,bets) VALUES ($1, $2, $3,$4,$5, $6, $7, $8, $9) RETURNING *",
               [p.pid, p.playernumber, p.headimage, p.maskedname, p.pname, p.initialbalance, p.finalbalance,p.betfinished,p.bets],
               (error, results) => {
                  if (error) {
                     throw error;
                  }
                  console.log("save player")
                  console.log('%d: %s LENGHT', i, p.pname,playersArr.length);
                  if(playersArr.length-1 == i){
                     resolve(results.rows);
                  }
            }
         );


     });

   });
   
};

export {getMessages,getSocketMessages,deleteAllPlayers,instantiatePlayers};
