const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const DELIVERY_FEE = 250; // valeur fixe simplifiée, à adapter selon la distance
const PAYMENT_METHODS = ['CARD', 'CASH', 'MOBILE_WALLET'];

function computeCommission(subtotal, rate) {
  return Math.round((subtotal * rate) / 100);
}

// POST /api/orders - créer une commande (client)
// Body : { restaurantId, items:[{menuItemId, quantity}], paymentMethod,
//          address:{label?, street, city}  OU  addressId }
router.post('/', authenticate, requireRole('CLIENT'), async (req, res) => {
  const { restaurantId, addressId, address, items, paymentMethod } = req.body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Commande invalide : restaurant ou articles manquants' });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Mode de paiement invalide' });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || !restaurant.isOpen || !restaurant.isApproved) {
      return res.status(400).json({ message: 'Restaurant indisponible' });
    }

    // Les articles doivent exister, être disponibles et appartenir à CE restaurant.
    // Les prix viennent toujours de la base, jamais du client.
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) }, restaurantId, isAvailable: true },
    });

    let subtotal = 0;
    const orderItemsData = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ message: 'Article invalide dans la commande' });
      }
      subtotal += menuItem.price * quantity;
      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity,
        unitPrice: menuItem.price,
        notes: item.notes || null,
      });
    }

    // Adresse : existante (et appartenant au client) ou créée à la volée
    let finalAddressId = addressId;
    if (finalAddressId) {
      const existing = await prisma.address.findFirst({
        where: { id: finalAddressId, userId: req.user.userId },
      });
      if (!existing) return res.status(400).json({ message: 'Adresse introuvable' });
    } else if (address && address.street && address.city) {
      const created = await prisma.address.create({
        data: {
          label: address.label || 'Livraison',
          street: String(address.street).trim().slice(0, 200),
          city: String(address.city).trim().slice(0, 100),
          userId: req.user.userId,
        },
      });
      finalAddressId = created.id;
    } else {
      return res.status(400).json({ message: 'Adresse de livraison requise' });
    }

    const commissionAmount = computeCommission(subtotal, restaurant.commissionRate);
    const total = subtotal + DELIVERY_FEE;

    const order = await prisma.order.create({
      data: {
        clientId: req.user.userId,
        restaurantId,
        addressId: finalAddressId,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        commissionAmount,
        total,
        paymentMethod,
        items: { create: orderItemsData },
        statusHistory: { create: { status: 'PENDING' } },
      },
      include: { items: true },
    });

    // Notifier le restaurant en temps réel
    req.app.get('io').to(`restaurant:${restaurantId}`).emit('new_order', order);

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
});

// GET /api/orders/mine - commandes du client connecté
router.get('/mine', authenticate, requireRole('CLIENT'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { clientId: req.user.userId },
    include: { items: { include: { menuItem: true } }, restaurant: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// GET /api/orders/:id - détail d'une commande (réservé aux personnes concernées)
router.get('/:id', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { menuItem: true } },
      restaurant: true,
      driver: { include: { user: { select: { fullName: true, phone: true } } } },
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) return res.status(404).json({ message: 'Commande introuvable' });

  const { userId, role } = req.user;
  let allowed = role === 'ADMIN' || order.clientId === userId;
  if (!allowed && role === 'RESTAURANT') allowed = order.restaurant.ownerId === userId;
  if (!allowed && role === 'DRIVER') allowed = !!order.driver && order.driver.userId === userId;
  if (!allowed) return res.status(403).json({ message: 'Accès refusé' });

  res.json(order);
});

const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
};

// Statuts que chaque rôle a le droit de poser
const ROLE_STATUSES = {
  RESTAURANT: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'],
  DRIVER: ['PICKED_UP', 'ON_THE_WAY', 'DELIVERED'],
};

// PATCH /api/orders/:id/status - changer le statut d'une commande
router.patch('/:id/status', authenticate, requireRole('RESTAURANT', 'DRIVER', 'ADMIN'), async (req, res) => {
  const { status } = req.body;
  const { userId, role } = req.user;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true, driver: true },
  });
  if (!order) return res.status(404).json({ message: 'Commande introuvable' });

  if (role === 'RESTAURANT' && (order.restaurant.ownerId !== userId || !ROLE_STATUSES.RESTAURANT.includes(status))) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  if (role === 'DRIVER' && (!order.driver || order.driver.userId !== userId || !ROLE_STATUSES.DRIVER.includes(status))) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const allowedNext = VALID_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(status)) {
    return res.status(400).json({ message: `Transition invalide de ${order.status} vers ${status}` });
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, statusHistory: { create: { status } } },
  });

  // Notifier le client en temps réel du changement de statut
  req.app.get('io').to(`client:${order.clientId}`).emit('order_status_update', {
    orderId: order.id,
    status,
  });

  res.json(updated);
});

module.exports = router;
