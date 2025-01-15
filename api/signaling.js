import { WebSocketServer } from "ws";

let wss;

export default function handler(req, res) {
  // Only accept WebSocket upgrade requests
  if (req.method === "GET") {
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === "websocket") {
      const { socket } = res;
      wss = new WebSocketServer({ noServer: true });

      wss.on("connection", (ws) => {
        console.log("WebSocket connection established");

        // Handle incoming messages
        ws.on("message", (message) => {
          console.log("Received message:", message);
          // Broadcast the message to other connected clients
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === client.OPEN) {
              client.send(message);
            }
          });
        });

        // Handle connection close
        ws.on("close", () => {
          console.log("WebSocket connection closed");
        });
      });

      // Handle WebSocket upgrade request
      res.socket.on("upgrade", (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      });

      // Respond with 101 status code for WebSocket connection
      res.status(101).end();
    } else {
      res.status(426).send("Upgrade Required");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
