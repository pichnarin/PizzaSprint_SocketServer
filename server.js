const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON request body

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// listen to the /order-notification endpoint from Laravel
app.post('/recieve-order', (rep, res) => {
  const { order_id, order_number, status, total } = rep.body;

  //debug purpose
  console.log('New order notification:', rep.body);

  io.emit('a-customer-place-an-order', { order_id, order_number, status, total });

  res.status(200).send('Notificationn sent to client.');
})


//listen the /order-status endpoint fron laravel
app.put('/order-status', (rep, res) => {
  const { order_id, order_number, status , driver_lat, driver_long} = rep.body;

  //debug purpose
  console.log('Order status updated:', rep.body);

  io.emit('order-status-updated', { order_id, driver_lat, driver_long, order_number, status });

  res.status(200).send('Notification sent to client.');
})



io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
