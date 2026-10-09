const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');
const { generateOtpCode, sendOtpSms } = require('../utils/otp');

const router = express.Router();
const OTP_EXPIRY_MINUTES = 5;
// Rôles qu'un utilisateur peut choisir lui-même. ADMIN ne s'attribue jamais via l'API.
const SELF_SERVICE_ROLES = ['CLIENT', 'RESTAURANT', 'DRIVER'];

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

// POST /api/auth/request-otp
// Envoie un code OTP au numéro de téléphone fourni
router.post(
  '/request-otp',
  [body('phone').isMobilePhone().withMessage('Numéro de téléphone invalide')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    try {
      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      let user = await prisma.user.findUnique({ where: { phone } });

      await prisma.otpCode.create({
        data: {
          phone,
          code,
          expiresAt,
          userId: user ? user.id : undefined,
        },
      });

      await sendOtpSms(phone, code);

      res.json({
        message: 'Code envoyé avec succès',
        isNewUser: !user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de l'envoi du code" });
    }
  }
);

// POST /api/auth/verify-otp
// Vérifie le code OTP et crée/connecte l'utilisateur
router.post(
  '/verify-otp',
  [
    body('phone').isMobilePhone(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code, fullName, role } = req.body;
    const safeRole = SELF_SERVICE_ROLES.includes(role) ? role : 'CLIENT';

    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: { phone, code, verified: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Code invalide' });
      }

      if (otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Code expiré' });
      }

      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      let user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            fullName: fullName || null,
            role: safeRole,
            isVerified: true,
          },
        });
      } else if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }

      const token = generateToken(user);

      res.json({
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la vérification' });
    }
  }
);

module.exports = router;
