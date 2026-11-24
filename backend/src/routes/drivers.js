const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const ACTIVE_STATUSES = ['READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY'];
const MAX_ACTIVE_DELIVERIES = 3;

router.use(authenticate, requireRole('DRIVER'));

async function loadDriver(req, res) {
  const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
  if (!driver) {
    res.status(404).json({ message: 'Profil livreur introuvable' });
    return null;
  }
  return driver;
}

// GET /api/drivers/me - profil du livreur connecté
router.get('/me', async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: req.user.userId },
    include: { user: { select: { fullName: true, phone: true } } },
  });
  if (!driver) return res.status(404).json({ message: 'Profil livreur introuvable' });
  res.json(driver);
});

// POST /api/drivers/register - créer son profil livreur (à approuver par l'admin)
router.post('/register', async (req, res) => {
  const vehicleType = String(req.body.vehicleType || '').trim().slice(0, 50);
  if (!vehicleType) return res.status(400).json({ message: 'Type de véhicule requis' });

  const existing = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
  if (existing) return res.status(400).json({ message: 'Profil livreur déjà existant' });

  const driver = await prisma.driver.create({
    data: { userId: req.user.userId, vehicleType },
  });
  res.status(201).json(driver);
});

// PATCH /api/drivers/availability - se mettre en ligne / hors ligne
router.patch('/availability', async (req, res) => {
  const driver = await loadDriver(req, res);
  if (!driver) return;

  if (typeof req.body.isAvailable !== 'boolean') {
    return res.status(400).json({ message: 'isAvailable (booléen) requis' });
  }
  if (req.body.isAvailable && !driver.isApproved) {
    return res.status(403).json({ message: "Ton profil n'a pas encore été approuvé" });
  }

  const updated = await prisma.driver.update({
    where: { id: driver.id },
    data: { isAvailable: req.body.isAvailable },
  });
  res.json(updated);
});

// GET /api/drivers/available-orders - commandes prêtes et sans livreur
router.get('/available-orders', async (req, res) => {
  const driver = await loadDriver(req, res);
  if (!driver) return;
  if (!driver.isApproved || !driver.isAvailable) return res.json([]);

  const orders = await prisma.order.findMany({
    where: { status: 'READY_FOR_PICKUP', driverId: null },
    select: {
      id: true,
      total: true,
      deliveryFee: true,
      paymentMethod: true,
      createdAt: true,
      restaurant: { select: { name: true, address: true, city: true } },
      deliveryAddress: { select: { street: true, city: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  res.json(orders);
});

// POST /api/drivers/orders/:id/accept - accepter une course
router.post('/orders/:id/accept', async (req, res) => {
  const driver = await loadDriver(req, res);
  if (!driver) return;

  if (!driver.isApproved) return res.status(403).json({ message: "Ton profil n'a pas encore été approuvé" });
  if (!driver.isAvailable) return res.status(400).json({ message: 'Passe en ligne pour accepter une course' });

  const active = await prisma.order.count({
    where: { driverId: driver.id, status: { in: ACTIVE_STATUSES } },
  });
  if (active >= MAX_ACTIVE_DELIVERIES) {
    return res.status(400).json({ message: `Maximum ${MAX_ACTIVE_DELIVERIES} livraisons en cours` });
  }

  // Attribution atomique : si un autre livreur l'a prise entre-temps, count vaut 0
  const result = await prisma.order.updateMany({
    where: { id: req.params.id, driverId: null, status: 'READY_FOR_PICKUP' },
    data: { driverId: driver.id },
  });
  if (result.count === 0) {
    return res.status(409).json({ message: "Cette course a déjà été prise ou n'est plus disponible" });
  }

  res.json({ message: 'Course acceptée', orderId: req.params.id });
});

// GET /api/drivers/mine/orders - livraisons en cours et dernières terminées
router.get('/mine/orders', async (req, res) => {
  const driver = await loadDriver(req, res);
  if (!driver) return;

  const orders = await prisma.order.findMany({
    where: { driverId: driver.id, status: { in: [...ACTIVE_STATUSES, 'DELIVERED'] } },
    select: {
      id: true,
      status: true,
      total: true,
      deliveryFee: true,
      paymentMethod: true,
      createdAt: true,
      updatedAt: true,
      restaurant: { select: { name: true, address: true, city: true } },
      deliveryAddress: { select: { street: true, city: true } },
      client: { select: { fullName: true, phone: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });
  res.json(orders);
});

module.exports = router;
