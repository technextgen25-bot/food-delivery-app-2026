require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const driverRoutes = require('./routes/drivers');
const adminRoutes = require('./routes/admin');

const app = express();

// Render place l'app derrière un proxy : nécessaire pour que le rate limit identifie les vraies IP
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Limite le nombre de requêtes pour protéger contre les abus (ex: spam d'OTP)
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 }); // freine le brute-force des codes à 6 chiffres
app.use('/api/auth/request-otp', otpLimiter);
app.use('/api/auth/verify-otp', verifyLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io : gestion des salons (rooms) pour cibler les notifications
io.on('connection', (socket) => {
  socket.on('join_client_room', (clientId) => socket.join(`client:${clientId}`));
  socket.on('join_restaurant_room', (restaurantId) => socket.join(`restaurant:${restaurantId}`));
  socket.on('join_driver_room', (driverId) => socket.join(`driver:${driverId}`));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
