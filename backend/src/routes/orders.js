const express = require('express');
const prisma = require('../prismaClient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const DELIVERY_FEE = 250; // valeur fixe simplifiée, à adapter selon distance

function computeCommission(subtotal, rate) {
  return Math.round((subtotal * rate) / 100);
}

// POST /api/orders - créer une commande (client)
router.post('/', authenticate, requireRole('CLIENT'), async (req, res) => {
  const { restaurantId, addressId, items, paymentMethod } = req.body;
  // items: [{ menuItemId, quantity, notes }]

  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || !restaurant.isOpen) {
      return res.status(400).json({ message: 'Restaurant indisponible' });
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      subtotal += menuItem.price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        notes: item.notes || null,
      };
    });

    const commissionAmount = computeCommission(subtotal, restaurant.commissionRate);
    const total = subtotal + DELIVERY_FEE;

    const order = await prisma.order.create({
      data: {
        clientId: req.user.userId,
        restaurantId,
        addressId,
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

// GET /api/orders/:id - détail d'une commande (avec vérification d'accès)
router.get('/:id', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { menuItem: true } },
      restaurant: true,
      driver: { include: { user: true } },
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) return res.status(404).json({ message: 'Commande introuvable' });

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

// PATCH /api/orders/:id/status - changer le statut d'une commande
// Utilisé par le restaurant (ACCEPTED, PREPARING, READY) et le livreur (PICKED_UP, ON_THE_WAY, DELIVERED)
router.patch('/:id/status', authenticate, requireRole('RESTAURANT', 'DRIVER', 'ADMIN'), async (req, res) => {
  const { status } = req.body;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (!order) return res.status(404).json({ message: 'Commande introuvable' });

  const allowedNext = VALID_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(status)) {
    return res.status(400).json({ message: `Transition invalide de ${order.status} vers ${status}` });
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status,
      statusHistory: { create: { status } },
    },
  });

  // Notifier le client en temps réel du changement de statut
  req.app.get('io').to(`client:${order.clientId}`).emit('order_status_update', {
    orderId: order.id,
    status,
  });

  res.json(updated);
});

module.exports = router;
