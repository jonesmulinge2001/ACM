/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const institutions = [
    { name: 'University of Nairobi' },
    { name: 'Moi University' },
    { name: 'Kenyatta University' },
    { name: 'Egerton University' },
    { name: 'Maseno University' },
    { name: 'Jomo Kenyatta University of Agriculture & Technology' },
    { name: 'Dedan Kimathi University of Technology' },
    { name: 'Chuka University' },
    { name: 'Pwani University' },
    { name: 'Technical University of Kenya' },
    { name: 'Technical University of Mombasa' },
    { name: 'Kisii University' },
    { name: 'University of Eldoret' },
    { name: 'South Eastern Kenya University' },
    { name: 'Murang’a University of Technology' },
    { name: 'Masinde Muliro University of Science & Technology' },
    { name: 'Laikipia University' },
    { name: 'Kibabii University' },
    { name: 'Karatina University' },
    { name: 'Kirinyaga University' },
    { name: 'Rongo University' },
    { name: 'Garissa University' },
    { name: 'Machakos University' },
    { name: 'Taita Taveta University' },
    { name: 'Meru University of Science and Technology' },
    { name: 'Maasai Mara University' },
    { name: 'University of Embu' },
    { name: 'University of Kabianga' },
    { name: 'Alupe University' },
    { name: 'Tom Mboya University' },
    { name: 'Tharaka University' },
    { name: 'Turkana University College' },
    { name: 'Co-operative University of Kenya' },
    { name: 'Open University of Kenya' },
    { name: 'Strathmore University' },
    { name: 'United States International University – Africa' },
    { name: 'Daystar University' },
    { name: 'Mount Kenya University' },
    { name: 'Kabarak University' },
    { name: 'Africa Nazarene University' },
    { name: 'Catholic University of Eastern Africa' },
    { name: 'Zetech University' },
    { name: 'Kenya Methodist University' },
    { name: 'Kiriri Women’s University of Science and Technology' },
    { name: 'Africa International University' },
    { name: 'Aga Khan University – Kenya' },
    { name: 'Adventist University of Africa' },
    { name: 'Gretsa University' },
    { name: 'KCA University' },
    { name: 'AMREF International University' },
    { name: 'Great Lakes University of Kisumu' },
    { name: 'Scott Christian University' },
    { name: 'Pioneer International University' },
    { name: 'International Leadership University' },
    { name: 'Riara University' },
    { name: 'Kenya Assemblies of God East University' },
    { name: 'Kenya Medical Training College' },
    { name: 'Kabete National Polytechnic' },
    { name: 'Eldoret National Polytechnic' },
    { name: 'Nyeri National Polytechnic' },
    { name: 'Baringo Technical College' },
    { name: 'Bomet Technical and Vocational College' },
    { name: 'Bukura Agricultural College' },
    { name: 'Aberdare Teachers Training College' },
    { name: 'Asumbi Teachers Training College' },
    { name: 'Bunyala Technical and Vocational College' },
    { name: 'Nairobi Institute of Business Studies' },
    { name: 'Management University of Africa College' },
    { name: 'Zetech College' },
    { name: 'Africa International University College' },
  ];

  for (const inst of institutions) {
    await prisma.institution.upsert({
      where: { name: inst.name },
      update: {},
      create: { name: inst.name }, // only the required field
    });
  }

  console.log('✅ Seeded all Kenyan institutions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
