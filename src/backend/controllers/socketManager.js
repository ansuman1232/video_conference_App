import { Server } from "socket.io";


let connections = {}// to know how many person are in a video call
let messages = {}
let timeOnline = {}
export const connectToSocket = (server) => {
    const io = new Server(server, {   cors : {
          origin:"*",
          methods:["GET","POST"],
          allowedHeaders:["*"],
          credentials:true
 
              }});
    //it is like an eventListener() like:-mouseenter ,onkeypres, 
    // when a client connects, io.on() triggers a callback function and gives you a socket object, 
    // which is like a direct phone line to that specific client.
    //Note:- here 1st parameter must connection
    io.on("connection", (socket) => {
        //======to test frontend socket.io.client is connected or not===========
        console.log("something connected to socket...")

        // 'socket' is the individual user who just joined
        // here 'join-call' or ahy other custom message we can give as 1st prameter
        //====Note:-  if  in server side it is socket.on () then in client side it will be socket.emit() 
        //====== and vice-versa=============
        socket.on('join-call', (path) => {

            //here each "path" is link of meeting adding all the
            //users id to that meeting.
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();//currtime user is online


            //io.to(socketId): This creates a "room" context containing only that specific user.
            //  It prepares the server to send a message to them.
            for (let a = 0; a < connections[path].length; a++) {
                /* io.to(...)
                 This method targets a specific destination. It acts like an address on an envelope.
                .emit() function is the "speak" command in Socket.IO. It is used to send a message (an event) from one side to the other.
 
                  Key Purpose
                Sending Data: It packages your event name (e.g., "chat-message") and 
                data (e.g., "Hello world!") and transmits it over the network
 
                 */
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }



            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    //here sending information to frontend so that when new message is added 
                    //to socketId then to check is it send current_user(me) or some other user.
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }


        });

        /*
         Since two computers cannot talk to each other directly at first, 
         they need this server code to pass notes between them to set up the call.
​

         socket.on("signal", ...): The server waits for a message from User A intended for User B.

         io.to(toId).emit(...): The server privately delivers that message only to User B (using toId
          and tells them it came from User A (socket.id)
        */
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });






   

        socket.on("chat-message",(data,sender)=>{
          /*
          The Object.entries() method converts an object into an array of key-value pairs.
          It takes an object (like a user profile) and returns a list where each item is a small array containing [key, value].
          example:-
          const user = {
           name: "Alice",
           role: "Admin",
            active: true
            };

      const result = Object.entries(user);

          console.log(result);
        // Output:
        // [
        //   ["name", "Alice"],
        //   ["role", "Admin"],
         //   ["active", true]
         // ]
            */

              /*


          This code handles sending chat messages to the correct room. When a user sends a "chat-message", 
          the server first figures out which room the user is in, 
        

       */


            const [matchingRoom,isFound]= Object.entries(connections).reduce(
               ([room,isFound],[roomKey,roomValue])=>{
                   if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey,true]
                   }
                   return [room,isFound];

               } ,['',false]);

               
            if(isFound===true){
                
               if(messages[matchingRoom]===undefined){
                //====means know one had send any kind of text message in this room , so initialized an obj array======
                messages[matchingRoom]=[];
               }
        

               //===now adding the current message to the room (saves the message to that room's history)===========
               messages[matchingRoom].push({"sender":sender,"data":data,"socket-id-sender":socket.id});
           
               //=====then broadcasts it to everyone in that room.===============
                connections[matchingRoom].forEach((ele)=>{
                    io.to(ele).emit("chat-message",data,sender,socket.id);
                });
           
            }

          
        })

//=========================when user wants to disconnect a meeting===========================
        socket.on("disconnect",()=>{
            //===know how much time user is online==============
            let onlineDuration=Math.abs( timeOnline[socket.id] -new Date());
            /*
            done this part using reduce() in socket.on(chat-message)
            By doing JSON.parse(JSON.stringify(...)), you create a clone. 
            we can modify around with this new list without accidentally breaking your original connections data
            */
             let curr_room;
             //======finding the room where the person exist========================
             for( const [room,person] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                 //=====matchin the person position in that room======
                 for(let a=0;a<person.length;a++){
                
                    if(person[a]===socket.id){
                    
                     curr_room=room;
                      //=====broadcasting all the person in the room the message that user had left=========
                       for(let i=0;i<person.length;i++){
                        io.to(person[i]).emit("user-left",socket.id);
                       }
                       //======deleting user from room============
                      let index=person.indexOf(socket.id);
                      connections[curr_room].splice(index,1);
                      //================No more person left in meeting then deleting that meeting or room=====================
                       if(connections[curr_room].length===0) delete connections[curr_room];
                    }
                 }
             }
           
        })

    });

    return io;
}