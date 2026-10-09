const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/restaurants/pending - restaurants en attente d'approbation
router.get('/restaurants/pending', async (req, res) => {
  const restaurants = await prisma.restaurant.findMany({ where: { isApproved: false } });
  res.json(restaurants);
});

// PATCH /api/admin/restaurants/:id/approve
router.patch('/restaurants/:id/approve', async (req, res) => {
  const restaurant = await prisma.restaurant.update({
    where: { id: req.params.id },
    data: { isApproved: true },
  });
  res.json(restaurant);
});

// GET /api/admin/drivers/pending - livreurs en attente d'approbation
router.get('/drivers/pending', async (req, res) => {
  const drivers = await prisma.driver.findMany({ where: { isApproved: false }, include: { user: true } });
  res.json(drivers);
});

// PATCH /api/admin/drivers/:id/approve
router.patch('/drivers/:id/approve', async (req, res) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { isApproved: true },
  });
  res.json(driver);
});

// GET /api/admin/stats - statistiques globales de la plateforme
router.get('/stats', async (req, res) => {
  const [totalOrders, totalRevenue, totalRestaurants, totalDrivers, totalClients] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { commissionAmount: true }, where: { paymentStatus: 'PAID' } }),
    prisma.restaurant.count({ where: { isApproved: true } }),
    prisma.driver.count({ where: { isApproved: true } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
  ]);

  res.json({
    totalOrders,
    totalCommissionRevenue: totalRevenue._sum.commissionAmount || 0,
    totalRestaurants,
    totalDrivers,
    totalClients,
  });
});

module.exports = router;
