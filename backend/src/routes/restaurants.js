const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/restaurants - liste publique des restaurants ouverts et approuvés
router.get('/', async (req, res) => {
  const { city, search } = req.query;

  const restaurants = await prisma.restaurant.findMany({
    where: {
      isApproved: true,
      isOpen: true,
      ...(city && { city }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      bannerUrl: true,
      rating: true,
      city: true,
    },
  });

  res.json(restaurants);
});

// GET /api/restaurants/:id - détail d'un restaurant + son menu
router.get('/:id', async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      menuItems: { where: { isAvailable: true }, include: { category: true } },
    },
  });

  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurant introuvable' });
  }

  res.json(restaurant);
});

// POST /api/restaurants - créer son restaurant (compte RESTAURANT)
router.post('/', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const { name, description, address, city, latitude, longitude } = req.body;

  const existing = await prisma.restaurant.findUnique({ where: { ownerId: req.user.userId } });
  if (existing) {
    return res.status(400).json({ message: 'Un restaurant existe déjà pour ce compte' });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      description,
      address,
      city,
      latitude,
      longitude,
      ownerId: req.user.userId,
    },
  });

  res.status(201).json(restaurant);
});

// PATCH /api/restaurants/:id/toggle-open - ouvrir/fermer le restaurant
router.patch('/:id/toggle-open', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });

  if (!restaurant || restaurant.ownerId !== req.user.userId) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const updated = await prisma.restaurant.update({
    where: { id: req.params.id },
    data: { isOpen: !restaurant.isOpen },
  });

  res.json(updated);
});

// POST /api/restaurants/:id/menu-items - ajouter un plat au menu
router.post('/:id/menu-items', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });

  if (!restaurant || restaurant.ownerId !== req.user.userId) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { name, description, price, imageUrl, categoryId } = req.body;

  const item = await prisma.menuItem.create({
    data: {
      name,
      description,
      price,
      imageUrl,
      categoryId,
      restaurantId: req.params.id,
    },
  });

  res.status(201).json(item);
});

module.exports = router;
