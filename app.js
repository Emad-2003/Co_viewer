const express = require("express");
const app = express();
const path = require("path");
const http = require("http");

const PORT = 4000;

const server = app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}... `);
});

const { Server } = require('socket.io'); // Updated for Socket.io v4
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

let users = 0;
let adminSocket = null;

io.on("connection", (socket) => {
    users++;

    // Assign role based on the number of users
    let role;
    if (users === 1) {
        role = "admin";
        adminSocket = socket;
    } else if (users <= 61) {
        role = "student";
    } else {
        console.log("Access denied: Only 60 students allowed.");
        socket.emit('accessDenied', 'Access is closed. Only 60 students allowed.');
        socket.disconnect();
        users--;
        return;
    }

    console.log(`User connected (${role}), no of users: ${users}`);

    // Send the role to the frontend
    socket.emit('role', role);

    // Listen for scroll position changes and broadcast if from admin
    socket.on('scroll', (data) => {
        if (data.role === "admin") {
            socket.broadcast.emit('syncScroll', data.scrollTop);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        if (role === "admin" && socket === adminSocket) {
            console.log('Admin disconnected, ending session for all students');
            
            // Disconnect all clients
            io.sockets.sockets.forEach((clientSocket) => {
                clientSocket.disconnect(true);
            });
            users = 0;  // Reset user count as all connections are closed
            adminSocket = null;
        } else {
            users--;
            console.log(`User disconnected (${role}), no of users: ${users}`);
        }
    });
});
