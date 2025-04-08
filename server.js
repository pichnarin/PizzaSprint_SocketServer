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
    origin: '*',  // Allow all origins
  }
});

//\simulateDriverMovement function
function simulateDriverMovement(start, end, steps, interval, order_id) {
  let currentStep = 0;

  const intervalId = setInterval(() => {
    if (currentStep > steps) {
      clearInterval(intervalId);
      return;
    }

    const lat = start.lat + ((end.lat - start.lat) / steps) * currentStep;
    const lng = start.lng + ((end.lng - start.lng) / steps) * currentStep;

    console.log(`Simulated driver location: ${lat}, ${lng}`);

    io.emit('driver-location', {
      order_id,
      driver_lat: lat,
      driver_long: lng,
    });

    currentStep++;
  }, interval);
}


//route for simulation ---
app.post('/start-simulation', (req, res) => {
  const { order_id, customer_lat, customer_long } = req.body;

  const start = { lat: 11.5389821, lng: 104.8332458 }; // Company location
  const end = { lat: customer_lat, lng: customer_long };

  simulateDriverMovement(start, end, 50, 1000, order_id);

  res.send('Simulation started');
});

// Listen to the /order-notification endpoint from Laravel
app.post('/recieve-order', (rep, res) => {
  const { order_id, order_number, status, total } = rep.body;

  // Debug purpose
  console.log('New order notification:', rep.body);

  io.emit('a-customer-place-an-order', { order_id, order_number, status, total });

  res.status(200).send('Notification sent to client.');
});

//listen the /order-status endpoint fron laravel
app.put('/order-status', (rep, res) => {
  const { order_id, order_number, status , driver_lat, driver_long} = rep.body;

  //debug purpose
  console.log('Order status updated:', rep.body);

  io.emit('order-status-updated', { order_id, driver_lat, driver_long, order_number, status });

  res.status(200).send('Notification sent to client.');
})

// Listen for the driver's location update (New Endpoint)
app.put('/driver-location-update', (req, res) => {
  const { order_id, driver_lat, driver_long } = req.body;

  console.log('Driver location updated:', req.body);

  io.emit('driver-location', { order_id, driver_lat, driver_long });

  res.status(200).send('Driver location updated.');
});


io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Listen for the driver's location update (alternative to PUT request in Express)
  socket.on('driver-location-update', (data) => {
    console.log('Driver Location Updated: ', data);

    // Emit the updated driver location to all connected clients (or to specific order)
    io.emit('driver-location', data);  // Broadcast the data to all clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
