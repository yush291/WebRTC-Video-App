const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("New user connected");

  // Listen for offer, answer, and candidate messages
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    // Broadcast offer, answer, or candidate
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    console.log("User disconnected");
  });
});

console.log("Signaling server running on ws://localhost:8080");
