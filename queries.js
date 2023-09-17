import pg from 'pg';
const Pool = pg.Pool;

import {playersData} from './mockdata.js';

const pool = new Pool({
     user: "me",
     host: "localhost",
     database: "blackjack",
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
               "INSERT INTO players (pid, playernumber,headimage,maskedname,pname,initialbalance,finalbalance,betfinished,bets,cards) VALUES ($1, $2, $3,$4,$5, $6, $7, $8, $9, $10) RETURNING *",
               [p.pid, p.playernumber, p.headimage, p.maskedname, p.pname, p.initialbalance, p.finalbalance,p.betfinished,p.bets,p.cards],
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

const finishedBet = (player,isFinished,botPlayerBet) => {
   console.log(player)
   console.log(isFinished)
  return new Promise((resolve) => {
           pool.query(
              `SELECT * FROM players WHERE pid = '${player.pid}'`,
              (error, results) => {
                 if (error) {
                    throw error;
                 }
                 const userPlayer = results.rows[0];
                 pool.query(
                  `UPDATE players
                  SET betfinished = ${Boolean(isFinished)}
                  WHERE pid = '${userPlayer.pid}' OR pname = '${userPlayer.pname}'`,
                  (error, results) => {
                     if (error) {
                        throw error;
                     }
                     resolve()
                     }
                  );
           }
        );
  });
  
};

const addBet = (player,bet,botPlayerBet) => {
    console.log(player)
    console.log(bet)
   return new Promise((resolve) => {
            pool.query(
               `SELECT * FROM players WHERE pid = '${player.pid}'`,
               (error, results) => {
                  if (error) {
                     throw error;
                  }
                  console.log(results.rows);
                  const userPlayer = results.rows[0];
                  var arrayBet = userPlayer.bets;
                  arrayBet.push(parseInt(bet));

                  var initialBal = results.rows[0].initialbalance - bet;

                  console.log(initialBal)
                  
                  if(botPlayerBet){
                        pool.query(
                           `UPDATE players
                           SET bets = ARRAY[${arrayBet}],initialbalance = ${initialBal}, betfinished = ${true}
                           WHERE pid = '${userPlayer.pid}' AND playernumber = ${userPlayer.playernumber}`,
                           (error, results) => {
                              if (error) {
                                 throw error;
                              }
                              console.log(results.rows);
                              resolve()
               
                        }
                     );
                  }else{
                        pool.query(
                           `UPDATE players
                           SET bets = ARRAY[${arrayBet}],initialbalance = ${initialBal} 
                           WHERE pid = '${userPlayer.pid}' AND playernumber = ${userPlayer.playernumber}`,
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
            }
         );
   });
   
};

const addBetOnOtherSlot = (player,bet) => {
   console.log(player)
   console.log(bet)
  return new Promise((resolve) => {
           pool.query(
              `SELECT * FROM players WHERE playernumber = '${player.playernumber}' OR pid = '10021' `,
              (error, results) => {
                 if (error) {
                    throw error;
                 }
               //   console.log(results.rows);
               //   console.log("PLAYER NUMBER");
                 const userSlotData = results.rows.filter(data => data.pid == '10021');
                 const userAccount = userSlotData[0];
                 const userOtherSlotData = results.rows.filter(data => data.playernumber == player.playernumber);

                 var arrayBet = userOtherSlotData[0].bets;

                 arrayBet.push(parseInt(bet));

                 var initialBal = userSlotData[0].initialbalance - bet;

                 console.log(initialBal)
                 
                 pool.query(
                    `UPDATE players
                    SET initialbalance = ${initialBal} 
                    WHERE pid = '10021'`,
                    (error, results) => {
                       if (error) {
                          throw error;
                       }
                       console.log("UPDATE USER INITIAL BALANCE")
                       console.log(results.rows);
                     //   resolve()

                       pool.query(
                        `UPDATE players
                        SET bets = ARRAY[${arrayBet}],pid = '${userAccount.pname}', pname = '${userAccount.pname}'
                        WHERE playernumber = '${player.playernumber}'`,
                        (error, results) => {
                           if (error) {
                              throw error;
                           }
                           console.log("UPDATE OTHER SLOT TO BE THE USER")
                           console.log(results.rows);
                           resolve()
            
                     }
                  );
        
                 }
              );
  
           }
        );
  });
  
};

export {getMessages,
      getSocketMessages,
      deleteAllPlayers,
      instantiatePlayers,
      addBet,
      addBetOnOtherSlot,
      finishedBet};
