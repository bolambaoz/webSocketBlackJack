import pg from 'pg';
const Pool = pg.Pool;

import {playersData} from './mockdata.js';

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
   const data = playersData()

   return new Promise((resolve) => {
      data.forEach( (p, i) => {
            pool.query(
               "INSERT INTO players (pid, playernumber,headimg,maskedname,pname,initialbalance,finalbalance,betfinished,bets) VALUES ($1, $2, $3,$4,$5, $6, $7, $8, $9) RETURNING *",
               [p.pid, p.playernumber, p.headimage, p.maskedname, p.pname, p.initialbalance, p.finalbalance,p.betfinished,p.bets],
               (error, results) => {
                  if (error) {
                     throw error;
                  }
                  console.log("save player")
                  console.log('%d: %s LENGHT', i, p.pname,data.length);
                  if(data.length-1 == i){
                     resolve(results.rows);
                  }
            }
         );


     });

   });
   
};

const addBet = (playerId,bet) => {
    console.log(playerId)
    console.log(bet)
   return new Promise((resolve) => {
            pool.query(
               `SELECT * FROM players WHERE pid = '${playerId}'`,
               (error, results) => {
                  if (error) {
                     throw error;
                  }
                  console.log(results.rows);
                  var arrayBet = results.rows[0].bets;
                  arrayBet.push(parseInt(bet));

                  var initialBal = results.rows[0].initialbalance - bet;

                  console.log(initialBal)
                  
                  pool.query(
                     `UPDATE players
                     SET bets = ARRAY[${arrayBet}],initialbalance = ${initialBal} 
                     WHERE pid = '${playerId}'`,
                     (error, results) => {
                        if (error) {
                           throw error;
                        }
                        // console.log("save player")
                        console.log(results.rows);
                        resolve()
         
                  }
               );
   
            }
         );
   });
   
};

export {getMessages,getSocketMessages,deleteAllPlayers,instantiatePlayers,addBet};
