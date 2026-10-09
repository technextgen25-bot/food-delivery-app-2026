/**
 * Script utilitaire pour créer le tout premier compte administrateur.
 * Usage : node scripts/create-admin.js +213600000000
 *
 * L'utilisateur devra ensuite se connecter normalement via l'app admin
 * (numéro de téléphone + code OTP) pour accéder au back-office.
 */
const prisma = require('../src/prismaClient');

async function main() {
  const phone = process.argv[2];

  if (!phone) {
    console.error('Usage : node scripts/create-admin.js <numero_de_telephone>');
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: 'ADMIN' },
    create: { phone, role: 'ADMIN', isVerified: true },
  });

  console.log(`✅ Utilisateur ${user.phone} est maintenant ADMIN (id: ${user.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
