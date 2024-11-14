const express = require("express");
const app = express();
const path = require("path");
const http = require("http");

const PORT = 4000;

const server = app.listen(PORT,()=>{
    console.log(`Server is listening on ${PORT}... `);
})

const { Server } = require('socket.io'); // Updated for Socket.io v4
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

let admin
let users = 0 
io.on("connection",(socket)=>{
    users++;
    console.log(`user connected, no of users : ${users}`);

    // Assign roles based on the number of users connected
    if (users === 1) {
        admin = 1 ;  // user 1 -> Admin / Teacher
    } else if (users <=61) {
        admin = 0;  // Users 2-61 -> students
    } else {
        // user > 61 -> Reject connection 
        console.log("access denied");
        socket.emit('accessDenied', 'Access is closed. Only 60 students allowed.');
        socket.disconnect();
        users--;
        return;
    }

    // Send admin to frontend
    socket.emit('admin', admin);

    // Listen for scroll position changes
    socket.on('scroll', (scrollTop) => {
        socket.broadcast.emit('syncScroll', scrollTop);
    });

    socket.on("disconnect",()=>{
        users--;
        console.log(`user disconnected, no of users : ${users}`);
    });
});


