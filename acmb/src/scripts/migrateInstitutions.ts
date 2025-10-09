/* eslint-disable prettier/prettier */

import { PrismaClient } from '../../generated/prisma';

/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable prettier/prettier */

const prisma = new PrismaClient();

async function main() {
  // 1. Find all distinct institution strings in Profile
  const distinctInstitutions = await prisma.profile.findMany({
    distinct: ['institutionId'],
    select: { institutionId: true },
    where: { institutionId: { not: undefined } },
  });

  for (const { institutionId } of distinctInstitutions) {
    if (!institutionId) continue;

    // 2. Upsert institution
    const inst = await prisma.institution.upsert({
      where: { name: institutionId },
      update: {},
      create: { name: institutionId },
    });

    // 3. Update profiles with that string → point to institutionId
    await prisma.profile.updateMany({
      where: { institutionId },
      data: { institutionId: inst.id },
    });
  }
}

main()
  .then(() => {
    console.log('Migration complete');
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
