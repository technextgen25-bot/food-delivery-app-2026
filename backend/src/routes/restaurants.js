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

// GET /api/restaurants/mine - le restaurant du compte connecté (tous ses plats, même indisponibles)
// Doit être déclaré AVANT /:id
router.get('/mine', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: req.user.userId },
    include: { menuItems: { orderBy: { name: 'asc' } } },
  });

  if (!restaurant) {
    return res.status(404).json({ message: 'Aucun restaurant pour ce compte' });
  }

  res.json(restaurant);
});

// GET /api/restaurants/:id - détail public d'un restaurant + son menu
router.get('/:id', async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      menuItems: { where: { isAvailable: true }, include: { category: true } },
    },
  });

  if (!restaurant || !restaurant.isApproved) {
    return res.status(404).json({ message: 'Restaurant introuvable' });
  }

  // On ne divulgue pas le taux de commission ni le propriétaire au public
  const { commissionRate, ownerId, ...publicData } = restaurant;
  res.json(publicData);
});

// POST /api/restaurants - créer son restaurant (compte RESTAURANT)
router.post('/', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const { name, description, address, city, latitude, longitude } = req.body;

  if (!name || !String(name).trim() || !address || !String(address).trim() || !city || !String(city).trim()) {
    return res.status(400).json({ message: 'Nom, adresse et ville sont obligatoires' });
  }

  const existing = await prisma.restaurant.findUnique({ where: { ownerId: req.user.userId } });
  if (existing) {
    return res.status(400).json({ message: 'Un restaurant existe déjà pour ce compte' });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: String(name).trim().slice(0, 100),
      description: description ? String(description).trim().slice(0, 500) : null,
      address: String(address).trim().slice(0, 200),
      city: String(city).trim().slice(0, 100),
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
  const priceNumber = Number(price);

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Le nom du plat est obligatoire' });
  }
  if (!Number.isFinite(priceNumber) || priceNumber <= 0 || priceNumber > 1000000) {
    return res.status(400).json({ message: 'Prix invalide' });
  }

  const item = await prisma.menuItem.create({
    data: {
      name: String(name).trim().slice(0, 100),
      description: description ? String(description).trim().slice(0, 300) : null,
      price: priceNumber,
      imageUrl,
      categoryId,
      restaurantId: req.params.id,
    },
  });

  res.status(201).json(item);
});

// PATCH /api/restaurants/:id/menu-items/:itemId - modifier un plat (disponibilité, prix, nom)
router.patch('/:id/menu-items/:itemId', authenticate, requireRole('RESTAURANT'), async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });

  if (!restaurant || restaurant.ownerId !== req.user.userId) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.itemId, restaurantId: restaurant.id },
  });
  if (!item) return res.status(404).json({ message: 'Plat introuvable' });

  const data = {};
  if (typeof req.body.isAvailable === 'boolean') data.isAvailable = req.body.isAvailable;
  if (req.body.price !== undefined) {
    const p = Number(req.body.price);
    if (!Number.isFinite(p) || p <= 0 || p > 1000000) {
      return res.status(400).json({ message: 'Prix invalide' });
    }
    data.price = p;
  }
  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    data.name = req.body.name.trim().slice(0, 100);
  }

  const updated = await prisma.menuItem.update({ where: { id: item.id }, data });
  res.json(updated);
});

module.exports = router;
