/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
// src/db/seed-institutions.ts

import { PrismaClient } from '../../generated/prisma';


const prisma = new PrismaClient();

async function seedInstitutions() {
  const institutions = [
    { name: 'Alupe University' },
    { name: 'Bomet University College' },
    { name: 'Chuka University' },
    { name: 'Co-operative University of Kenya' },
    { name: 'Dedan Kimathi University of Technology' },
    { name: 'Egerton University' },
    { name: 'Garissa University' },
    { name: 'Jaramogi Oginga Odinga University of Science & Technology' },
    { name: 'Jomo Kenyatta University of Agriculture & Technology' },
    { name: 'Karatina University' },
    { name: 'Kenyatta University' },
    { name: 'Kibabii University' },
    { name: 'Kirinyaga University' },
    { name: 'Kisii University' },
    { name: 'Laikipia University' },
    { name: 'Maasai Mara University' },
    { name: 'Machakos University' },
    { name: 'Maseno University' },
    { name: 'Masinde Muliro University of Science & Technology' },
    { name: 'Meru University of Science and Technology' },
    { name: 'Moi University' },
    { name: 'Murang’a University of Technology' },
    { name: 'Open University of Kenya' },
    { name: 'Pwani University' },
    { name: 'Rongo University' },
    { name: 'South Eastern Kenya University' },
    { name: 'Taita Taveta University' },
    { name: 'Technical University of Kenya' },
    { name: 'Technical University of Mombasa' },
    { name: 'Tharaka University' },
    { name: 'Tom Mboya University' },
    { name: 'Turkana University College' },
    { name: 'University of Eldoret' },
    { name: 'University of Embu' },
    { name: 'University of Kabianga' },
    { name: 'University of Nairobi' },
    // Add private universities as needed
    { name: 'Africa International University' },
    { name: 'Africa Nazarene University' },
    { name: 'Aga Khan University – Kenya' },
    { name: 'Adventist University of Africa' },
    { name: 'Catholic University of Eastern Africa' },
    { name: 'Daystar University' },
    { name: 'Gretsa University' },
    { name: 'KCA University' },
    { name: 'Mount Kenya University' },
    { name: 'United States International University – Africa' },
  ];

  for (const inst of institutions) {
    await prisma.institution.upsert({
      where: { name: inst.name },
      update: {},
      create: inst,
    });
  }

  console.log('✅ Seeded Kenyan institutions');
  await prisma.$disconnect();
}

seedInstitutions().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
