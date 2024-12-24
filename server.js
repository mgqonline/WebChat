const express = require('express');
const http = require('http');
const app = express();
const WebSocket = require('ws');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 添加 CORS 头部信息
wss.on('headers', (headers, req) => {
    headers.push('Access-Control-Allow-Origin: *');
  });
  
// 或者更简单的做法是在创建 WebSocketServer 实例之前配置 Express
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
wss.on('connection', (ws) => {
  console.log('New Client connected');
  
  function broadcast(message){
    wss.clients.forEach(function(client){
        if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify(message));
      }
    });
  }
  ws.on('message', (message) => {
    try{
            const data = JSON.parse(message);
            console.log(data);
            console.log(`Received message: ${data.type}, from user: ${data.username}`);
            switch (data.type) {
                case 'JOIN':
                    broadcast({
                        type: 'JOIN',
                        username: data.username,
                        text: `${data.username} joined the chat`
                    });
                    break;
                case 'MESSAGE':
                    broadcast({
                        type: 'MESSAGE',
                        username: data.username,
                        text: data.text
                    });
                    break;
                case 'LEAVE':
                    broadcast({
                        type: 'LEAVE',
                        username: data.username,
                        text: `${data.username} left the chat`
                    });
                    break;
                default:
                    throw new Error('Unknown message type:', data.type);
            }
        } catch(e){
            console.error('Error:', e);
            ws.send(JSON.stringify({
                type: 'ERROR',
                text: e.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        broadcast({
            type: 'LEAVE',
            username: ws.username,
            text: `${ws.username} left the chat`
        });
    });
  });

  const PORT = process.env.PORT || 3010;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
