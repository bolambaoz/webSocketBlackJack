# webSocketBlackJack

#DUCOMENTATIONS
-https://javascript.plainenglish.io/how-to-build-a-websocket-chat-application-819399d55800

How to Build a WebSocket Chat Application

Matthew Sedlacek
JavaScript in Plain English
Matthew Sedlacek
·
Follow
Published in
JavaScript in Plain English
·
18 min read
·
Dec 28, 2020
135

2





Photo by Yogas Design on Unsplash
Before diving into this blog, I recommend taking a look at my previous blog, where I introduce WebSocket APIs. From the article, you will find a high-level overview of how WebSockets APIs work and the main components of a WebSocket API. This blog will focus on the technologies and steps I used to create a WebSocket Chat Application that meets the following guidelines:
Logs messages as they happen and shares those messages with everyone connected to the app immediately.
Results remain between sessions and only the last ten messages are displayed in descending from most recent to oldest.
Technologies
Backend: CRUD WebSocket API: Node.js, Express.js, Socket.io, and PostgreSQL
Frontend: React and Socket.io
Deployment: Heroku and Netlify
Backend
Overview: Our backend will consist of a CRUD WebSocket API using a Node.js environment running on an Express.js server that utilizes Socket.io and a PostgreSQL database. Now, that was a lot of vocabulary and technologies listed at once. So, let’s define each piece before we start coding.
CRUD — CRUD stands for (Create, Read, Update, and Delete) and are the four key functionalities for an API. Our Chat Application will utilize Create and Read only.
API (Application Programming Interface) — “…is a set of programming code that enables data transmission between one software product and another. It also contains the terms of this data exchange” (Altexsoft).
WebSocket API — “ …an advanced technology that makes it possible to open a two-way interactive communication session between the user’s browser and a server.” (Mozilla). More information here.
Node.js — “An open-source, cross-platform, back-end, JavaScript runtime environment that executes JavaScript code outside a web browser” (Wikipedia).
Express.js — “…a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications” (Express).
PostgreSQL (Postgres) — “…a powerful, open source object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance” (Postgresql.org).
Socket.io — “Socket.IO is a library that enables real-time, bidirectional and event-based communication between the browser and the server. It consists of a Node.js server and a Javascript client library for the browser” (Socket.io).
Now let’s get to coding by creating our Postgres database.
Database Creation
Instructions require that Homebrew is installed on your local machine. For setup instructions see link.
If you have not done so already, install PostgreSQL. For Mac users, type brew install postgresql in the terminal.
Connect to the default postgres database by typing in your terminal psql postgres
Create a user with name me and password of password CREATE ROLE me WITH LOGIN PASSWORD 'password';
Give me the ability to create a database ALTER ROLE me CREATEDB;
Exit default postgres using \q
Connect postgres with me psql -d postgres -U me
Create a database CREATE DATABASE api;
Connect to new api database \c api
Create a Table in the api database using the below SQL command. This SQL command creates columns in our Postgres table for an ID, text, username, and a created_at timestamp. Feel free to edit based on the needs of your application.
CREATE TABLE messages (
  ID SERIAL PRIMARY KEY,
  text varchar(255) NOT NULL,
  username varchar(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
10. Set the Time Zone to UTC. SET TIMEZONE='UTC'; . This step is not required but will allow you to convert UTC timestamps to a users local time using Moment.js in the frontend. To learn more, read my blog here.
11. Seed the messages table with the below SQL command. (Make sure the column names are consistent with the table you created in Step 9)
INSERT INTO messages (text, username)
  VALUES ('1+1=2', 'matthew'), ('2+2=4', 'blake'), ('3+3=6', 'julie'), ('4+4=8', 'courtney'), ('5+5=10', 'brian'), ('6+6=12', 'michael'), ('7+7=14', 'edward'), ('1+1=2', 'matthew'), ('2+2=4', 'blake'), ('3+3=6', 'julie');
12. Database is now set up, and you can leave psql with \q in your terminal.
Express.js Server Setup
Now, that we have our seeded Postgres database, we need to create our server.
In GitHub, create a blank repository and clone it down to the folder of your choice

I recommend initializing your GitHub Repo with a README and .gitignore
2. Enter your cloned repository usingcd
3. To create our package.json file type npm init -y
4. Open your directory in the code editor of your choice
// Your package.json file should look similar to this
{
  "name": "node-api-postgres",
  "version": "1.0.0",
  "description": "index.js",
  "main": "",
  "license": "ISC"
}
5. Install Express.js for our server npm install express --save
6. Connect to postgres using node -postgres npm install pg
Our server now has the required dependencies in the node_modules and package.json files. I recommend committing your work to GitHub and creating a local branch at this point git checkout -b local
Creating Express.js Server Entry Point
The entry point for our server will be index.js
Create index.js file in your code editor
Input the following code into the index.js file
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
app.get('/', (request, response) => {
  response.json({ info: 'Our app is up and running' })
})
app.listen(port, () => {
  console.log(`App running on ${port}.`)
})
In the above, we need to require express and a built-in express middleware called body-parser. NPM explains that Body-parse, “Parse[s] incoming request bodies in a middleware before your handlers, available under the req.body property”(NPM).
The first app.get is the home route for our application and will show the info message when we run the server node index.jsin localhost:3000.
The app.listen tells us what port our app is running on in the terminal.

Localhost: 3000

Terminal
Our Express.js server is running; now we need to connect to the Postgres database we created earlier.
Postgres database Connection
As mentioned earlier, we installed node-postgres to allow for our Postgres database to connect to our Node.js/Express.js server. Now let’s create the connection.
Create queries.js file
Input the following code to setup our connection to the postgres database. In our example, we are using node-postgres’s built-in connection pooling. We use pooling because our application will be making queries frequently. Also, using a pool architecture “… ensures ‘closed’ connections are not really closed, but returned to a pool, and ‘opening’ a new connection returns the same ‘physical connection’ back, reducing the actual forking on the PostgreSQL side” (ScaleGrid).
// Please note that if you changed the user, database, or password in the database creation section you will need to update the respective line items below.
const Pool = require("pg").Pool;
const pool = new Pool({
     user: "me",
     host: "localhost",
     database: "api",
     password: "password",
     port: 5432,
});
Now that we have connected to our database, we will create our CRUD operations and route.
CRUD Operations & Route
This app will only use the Create and Read functionalities and therefore needs only a single endpoint /messages. While creating our CRUD actions, we will need to make changes in both our index.js and queries.js files. Let’s start with queries.js.
Remember that our application requires that we only display the last ten messages descending from most recent to oldest. We can now take care of this requirement by creating a GET request (The Read in CRUD) called getMessages.
// queries.js
const getMessages = (request, response) => {
   pool.query(
      "SELECT * FROM messages ORDER BY id DESC LIMIT 10",
      (error, results) => {
         if (error) {
            throw error;
         }
         response.status(200).json(results.rows);
      }
   );
};
Using pooling enables us to enter raw SQL that will pull from our Postgres database. The raw SQL is key to meeting our project requirements. In plain English, the SQL statement selects everything from the messages table and orders rows from oldest to newest, and limits the selection to only ten messages.
Our users also need to be able to create messages. This requires a POST request to our endpoint (The Create in CRUD). Let’s make this functionality now.
const createMessage = (request, response) => {
   const { text, username } = request.body;
   pool.query(
   "INSERT INTO messages (text, username) VALUES ($1, $2) RETURNING 
   text, username, created_at",
      [text, username],
      (error, results) => {
         if (error) {
            throw error;
         }
         response.status(201).send(results.rows);
         }
   );
};
Here, we are using pooling again to enter raw SQL that will add our users’ messages into our Postgres database. In plain English, the SQL statement puts into the messages table an entry where our application will provide the values for text and username. We also are telling our query to return the created_at timestamp in addition to the text and username.
The last step we need to do in queries.js is to make the methods accessible to index.js. We can do this by adding module.exports to the bottom of our file.
module.exports = {
   getMessages,
   createMessage,
};
Now in index.js all we need to do to utilize these methods is add the following.
// Add to the top of the index.js file with the other requires
const db = require('./queries')
// Add to the bottom
app.get("/messages", db.getMessages);
app.post("/messages", db.createMessage);
Now, if we run node index.js we can go to http://localhost:3000/messages and see our messages. You should see something similar to the below.

Example of current output
Now, this is where we could stop if we were implementing a RESTful API. However, our app requires a WebSocket API. I would recommend pushing up this branch to GitHub and then creating a branch called Socketio.
Socket.io Implementation (Local)
As mentioned previously, Socket.io is a “ …long polling/WebSocket based third party transfer protocol for Node.js” (Mozilla). In this section, we will install Socket.io and the other required dependencies to turn our API from a RESTful API to a WebSocket API.
Rename index.js to app.js to follow Socket.io convention
In package.json rename main value from index.js to app.js
"main": "app.js",
3. Install Socket.io with terminal command npm install socket.io
4. Install CORS using the terminal command npm i cors . Mozilla defines CORS or Cross-Origin Resource Sharing as, “…an HTTP-header based mechanism that allows a server to indicate any other origins (domain, scheme, or port) than its own from which a browser should permit loading of resources” (Mozilla). Without CORS, our frontend would not be able to send requests to our backend.
5. Using the documentation provided by Socket.io we need to add/update the bolded contents in our app.js to allow Socket.io and CORS implementation
// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 3000;
const socketPort = 8000;
const db = require("./queries");
const { emit } = require("process");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
   cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"],
   },
});
app.use(cors());
// parses requests for fetch
app.use(bodyParser.json());
app.use(
   bodyParser.urlencoded({
      extended: true,
   })
);
app.listen(port, () => {
   console.log(`App running on port ${port}.`);
});
app.get("/messages", db.getMessages);
app.post("/messages", db.createMessage);
6. Now that we are using a WebSocket API, we need to add new GET and POST requests in our queries.js file. See the RESTful API section for specifics regarding what these SQL queries do.
// queries.js
/* SOCKET DB */
const getSocketMessages = () => {
   return new Promise((resolve) => {
      pool.query(
         "SELECT * FROM messages ORDER BY id DESC LIMIT 10",
         (error, results) => {
            if (error) {
               throw error;
            }
            resolve(results.rows);
          }
      );
   });
};
const createSocketMessage = (message) => {
   return new Promise((resolve) => {
      pool.query(
         "INSERT INTO messages (text, username) VALUES ($1, $2) 
         RETURNING text, username, created_at",
         [message.text, message.username],
         (error, results) => {
            if (error) {
               throw error;
            }
            resolve(results.rows);
         }
      );
   });
};
7. To make these methods accessible to app.js we need to add them to our module.exports
// queries.js
module.exports = {
   getMessages,
   createMessage,
   getSocketMessages,
   createSocketMessage,
};
8. Lastly, we need to add our Socket.io methods to app.js
// app.js
// sends out the 10 most recent messages from recent to old
const emitMostRecentMessges = () => {
   db.getSocketMessages()
      .then((result) => io.emit("chat message", result))
      .catch(console.log);
};
// connects, creates message, and emits top 10 messages
io.on("connection", (socket) => {
   console.log("a user connected");
   socket.on("chat message", (msg) => {
      db.createSocketMessage(JSON.parse(msg))
         .then((_) => {
            emitMostRecentMessges();
         })
         .catch((err) => io.emit(err));
});

// close event when user disconnects from app
   socket.on("disconnect", () => {
      console.log("user disconnected");
   });
});

// Displays in terminal which port the socketPort is running on
server.listen(socketPort, () => {
   console.log(`listening on *:${socketPort}`);
});
9. To test our application, we can create an index.html file. Copy and paste the below source code for a quick example, or feel free to create your own. To run, you need to have two terminals; one for the server and the other to open the index.html file. The terminal commands to do this are node app.js and open index.html
<!doctype html>
<html>
   <head>
      <title>Socket.IO chat</title>
      <style>
         * { margin: 0; padding: 0; box-sizing: border-box; }
         body { font: 13px Helvetica, Arial; }
         form { background: #000; padding: 3px; position: fixed;   
         bottom: 0; width: 100%; }
         form input { border: 0; padding: 10px; width: 90%; 
         margin-right: 0.5%; }
         form button { width: 9%; background: rgb(130, 224, 255);
         border: none; padding: 10px; }
         #messages { list-style-type: none; margin: 0; padding: 0; }
         #messages li { padding: 5px 10px; }
         #messages li:nth-child(odd) { background: #eee; }
      </style>
   </head>
   <body>
      <ul id="messages"></ul>
      <form action="">
         <input id="username" autocomplete="off" 
          placeholder="username"/>
         <input id="m" autocomplete="off" placeholder="equation"/>
         <button>Send</button>
      </form>
      <script src="http://localhost:8000/socket.io/socket.io.js">.
      </script>
      <script>
         const socket = io("http://localhost:8000");
         const form = document.querySelector('form');
         const messages = document.querySelector('#messages');
   function createMessage(msg) {
      const li = document.createElement('li');
     li.textContent =`${msg.text},${msg.username},${msg.created_at}`
      messages.append(li);
   }
   function createMessages(msgs) {
      msgs.forEach(createMessage);
   }

   fetch("http://localhost:3000/messages")
   .then(res => res.json())
   .then(createMessages);
   
   form.addEventListener("submit", (e) => {
      e.preventDefault();
      socket.emit('chat message', JSON.stringify({
      text: document.querySelector('#m').value,
      username: document.querySelector('#username').value
     }));
      e.target.reset();
   });
   socket.on('chat message', function (msgs) {
      console.log(msgs)
      messages.innerHTML = "";
      createMessages(msgs);
   });
         </script>
   </body>
</html>

Index.html file after opening
Our WebSocket API is now complete and our Read and Create actions are working as expected. The last step now is to modify our API for deployment on Heroku.
Preparing Backend Server to be deployed on Heroku
At this point, I recommend pushing your socketio branch to GitHub and creating a new branch called deployment. Our deployment branch will be used to deploy our backend to Heroku.
Create a blank .env file for our app.js and queries.js files to reference in deployment
Heroku requires that we only have one port variable. See bold areas for changes
CORS origin will need to be updated to the netlify URL where our React frontend will be hosted
Need to remove redundant code app.listen(port, () => {console.log(`App running on port ${port}.`);});
The final app.js file should resemble the code below:
// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8000;
const db = require("./queries");
const { emit } = require("process");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
   cors: {
      origin: "{will need to input netlify url here}",
      methods: ["GET", "POST"],
   },
});
app.use(cors());
// parses requests for fetch
app.use(bodyParser.json());
app.use(
   bodyParser.urlencoded({
      extended: true,
   })
);
app.get("/messages", db.getMessages);
app.post("/messages", db.createMessage);
// sends out the 10 most recent messages from recent to oldest
const emitMostRecentMessges = () => {
   db.getSocketMessages()
      .then((result) => io.emit("chat message", result))
      .catch(console.log);
};
// connects, creates message, and emits top 10 messages
io.on("connection", (socket) => {
   console.log("a user connected");
   socket.on("chat message", (msg) => {
      db.createSocketMessage(JSON.parse(msg))
      .then((_) => {
         emitMostRecentMessges();
      })
         .catch((err) => io.emit(err));
   });
// close event when user disconnects from app
   socket.on("disconnect", () => {
      console.log("user disconnected");
   });
});
server.listen(PORT, () => {
   console.log(`listening on *:${PORT}`);
});
3. Update the connection pooling in the queries.js file to use the .env’s DATABASE_URL provided by Heroku.
The final queries.js file should resemble the code below:
// queries.js
const Pool = require("pg").Pool;
const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: {
      rejectUnauthorized: false,
   },
});
/* Local DB */
const getMessages = (request, response) => {
   pool.query(
      "SELECT * FROM messages ORDER BY id DESC LIMIT 10",
      (error, results) => {
         if (error) {
            throw error;
         }
         response.status(200).json(results.rows);
         }
      );
   };
const createMessage = (request, response) => {
   const { text, username } = request.body;
   pool.query(
      "INSERT INTO messages (text, username) VALUES ($1, $2)
      RETURNING text, username, created_at",
      [text, username],
      (error, results) => {
         if (error) {
            throw error;
         }
         response.status(201).send(results.rows);
      }
   );
};
/* SOCKET DB */
const getSocketMessages = () => {
   return new Promise((resolve) => {
      pool.query(
         "SELECT * FROM messages ORDER BY id DESC LIMIT 10",
         (error, results) => {
            if (error) {
               throw error;
            }
            resolve(results.rows);
            }
         );
     });
};
const createSocketMessage = (message) => {
   return new Promise((resolve) => {
      pool.query(
         "INSERT INTO messages (text, username) VALUES ($1, $2)  
         RETURNING text, username, created_at",
         [message.text, message.username],
         (error, results) => {
            if (error) {
               throw error;
            }
            resolve(results.rows);
          }
      );
   });
};
module.exports = {
   getMessages,
   createMessage,
   getSocketMessages,
   createSocketMessage,
};
4. Add engines and start script to package.json file (See bold sections).
The final package.json file should resemble the code below:
{
"name": "node-api-postgres",
"version": "1.0.0",
"description": "",
"engines": {
   "node": "12.18.4"
},
"main": "app.js",
"scripts": {
   "start": "node app.js",
   "test": "echo \"Error: no test specified\" && exit 1"
},
"repository": {
   "type": "git",
   "url": "git+https://github.com/matthewsedlacek/node-api
   -postgres.git"
},
"keywords": [],
"author": "",
"license": "ISC",
"bugs": {
"url": "https://github.com/matthewsedlacek/node-api-postgres/issues"
},
"homepage": "https://github.com/matthewsedlacek/node-api postgres#readme",
"dependencies": {
   "cors": "^2.8.5",
   "express": "^4.17.1",
   "pg": "^8.5.1",
   "socket.io": "^3.0.4"
}
}
5. Create a Procfile with the following code. If you are unfamiliar with Procfile, it is a way to declare commands that are run by our application’s dynos on Heroku.
web: node app.js
Now are file is ready to be deployed on Heroku.
Deploying to Heroku
These instructions are adopted from my previous blog regarding deployment.
Before starting, you will need to download and install the Heroku CLI. After you’ve created an account and logged in, you are ready to begin the process to host your backend on Heroku. In your terminal, type the following command.
heroku create
This command will create a new app on Heroku. If you would like to name your backend, include it in the line above; otherwise, Heroku will generate a name for you.
git push heroku main
The git push command will push your repository up to the Heroku app you created in the previous terminal command. You do not need to specify the name given to your app in the previous step because ‘heroku create’ builds a git remote called ‘heroku’ that points to the application you just created.
heroku addons:create heroku-postgresql:hobby-dev
The above command adds Postgres to our Heroku app.
heroku pg:reset
heroku pg:push name-of-local-database DATABASE_URL --app name-of-Heroku-app
Next, we need to reset our default Postgres and push up our local database. In our Create Database section we named our local database api. So, the name-of-local-database is api. DATABASE_URL should remain as is above along with — app. The name-of-Heroku-app can be found by scrolling up in your terminal and looking to see the name generated by the heroku create terminal command.
You now have a deployed backend hosted on Heroku. You can view your app by typing heroku open then adding a /messages to the URL.
*Please note that to avoid your Dyno’s from falling asleep, you will need to go into your Heroku account and upgrade the Dyno from Free to Hobby. This will keep your WebSocket API awake and will prevent undesired behavior with our WebSocket Chat Application.*

Change Dyno Type in the Resources Tab in Heroku
Frontend
This section, won’t focus on how to build a frontend, but more how Socket.io fits into our React frontend. The methods we will write will be in two separate components; one functional and one class component.
To get started, we need to install the socket.io client. To install, type the following command in the terminal:
npm i socket.io-client
In our functional component, we first need to import the Socket.io client. Then we need to create variables for our Socket Endpoint, Fetch Endpoint, and the WebSocket (See bold). In this functional component, we are using react hooks to set the initial HTTP handshake (see first bolded useEffect). Then we are using useEffect again to see if the client and server can continue over WebSockets. If so, our list of messages will update every time a user submits a message, and our WebSocket will be running in its desired manner.
import React from "react";
import { useEffect, useState } from "react";
import MessagesArea from "./MessagesArea";
import socketIOClient from "socket.io-client";
const socketEndpoint = "https://serene-crag-73795.herokuapp.com";
const fetchEndpoint = `${socketEndpoint}/messages`;
const socket = socketIOClient(socketEndpoint);
function ConversationsList(props) {
   const [messages, setMessages] = useState([]);
   useEffect(() => {
      fetch(fetchEndpoint)
      .then((res) => res.json())
      .then(setMessages)
      .catch(console.log);
   }, []);
   useEffect(() => {
      if (socket) {
         socket.on("chat message", (msgs) => {
            setMessages(msgs);
         });
      }
   }, []);
return (
   <React.Fragment>
      {messages.length > 0 ? (
         <MessagesArea
            messages={messages}
            username={props.username}
            userId={props.uid}
         />
      ) : null}
   </React.Fragment>
 );
}
export default ConversationsList;
The class component will handle sending new messages to the client. Similar to the functional component, we need to import Socket.io and create variables for our Socket Endpoint and the WebSocket (See bold). Note, we are not using fetch in this component as we are only sending new messages over the WebSocket. To send the new messages, we use an emit event (See bold). It’s also worth mentioning that the emit events we created socket.on and socket.emit have corresponding listeners in the app.js file in our backend.
import React, { Component } from "react";
import CalculatorDisplay from "../components/calculator/CalculatorDisplay";
import Keypad from "../components/calculator/Keypad";
import Card from "react-bootstrap/Card";
import socketIOClient from "socket.io-client";
const socketEndpoint = "https://serene-crag-73795.herokuapp.com";
const socket = socketIOClient(socketEndpoint);
class Calculator extends Component {
   state = {
   result: "",
   errorMessage: 0,
   resultPost: "",
   };
   onClick = (button) => {
      if (button === "=") {
         this.calculate();
      } else if (button === "C") {
         this.reset();
      } else if (button === "←") {
         this.backspace();
      } else {
         this.setState({
            result: this.state.result + button,
         });
      }
    };
   calculate = () => {
      try {
         this.handleSubmit();
      } catch (e) {
        this.setState({
          result: "error",
         });
      }
    };
   handleSubmit = (e) => {
      socket.emit(
         "chat message",
         JSON.stringify({
            text: this.state.result + " = " +
            (eval(this.state.result) || 0) + "",
            username: this.props.username,
         })
      );
      this.setState({ result: "" });
   };
   reset = () => {
      this.setState({
         result: "",
         resultPost: "",
      });
   };
   backspace = () => {
      this.setState({
         result: this.state.result.slice(0, -1),
      });
   };
   render() {
      return ["Primary"].map((variant, idx) => (
      <Card className="calculatorContainer" 
      bg={variant.toLowerCase()}>
         <Card.Body>
             <Card.Text>
                <CalculatorDisplay result={this.state.result} />
             </Card.Text>
             <Card.Text>
                 <Keypad
                    onClick={this.onClick}
                    resultPost={this.state.resultPost}
                    conversation_id={this.props.conversation_id}
                    username={this.props.username}
                 />
            </Card.Text>
         </Card.Body>
      </Card>
   ));
  }
}
export default Calculator;
Now our frontend is using the WebSocket protocol to communicate with our backend.
Deploying Frontend on Netlify
These instructions are adopted from my previous blog regarding deployment.
After creating an account with Netlify, select the “New site from Git” option.
