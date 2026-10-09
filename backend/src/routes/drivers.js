const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/drivers/register - créer un profil livreur
router.post('/register', authenticate, requireRole('DRIVER'), async (req, res) => {
  const { vehicleType } = req.body;

  const existing = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
  if (existing) return res.status(400).json({ message: 'Profil livreur déjà existant' });

  const driver = await prisma.driver.create({
    data: { userId: req.user.userId, vehicleType },
  });

  res.status(201).json(driver);
});

// PATCH /api/drivers/availability - se mettre disponible/indisponible
router.patch('/availability', authenticate, requireRole('DRIVER'), async (req, res) => {
  const { isAvailable } = req.body;

  const driver = await prisma.driver.update({
    where: { userId: req.user.userId },
    data: { isAvailable },
  });

  res.json(driver);
});

// GET /api/drivers/available-orders - commandes prêtes à être récupérées
router.get('/available-orders', authenticate, requireRole('DRIVER'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: 'READY_FOR_PICKUP', driverId: null },
    include: { restaurant: true, deliveryAddress: true },
  });

  res.json(orders);
});

// POST /api/drivers/orders/:id/accept - accepter une livraison
router.post('/orders/:id/accept', authenticate, requireRole('DRIVER'), async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { driverId: driver.id },
  });

  res.json(order);
});

// GET /api/drivers/mine/orders - commandes assignées au livreur connecté
router.get('/mine/orders', authenticate, requireRole('DRIVER'), async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });

  const orders = await prisma.order.findMany({
    where: { driverId: driver.id, status: { in: ['PICKED_UP', 'ON_THE_WAY'] } },
    include: { restaurant: true, deliveryAddress: true },
  });

  res.json(orders);
});

module.exports = router;
