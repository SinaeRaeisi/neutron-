const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('در حال ساخت کاربران اولیه...')

  const users = [
    { id: "u1", name: "سارا محمدی", email: "sara@example.com", role: "student", phone: "09120000001", grade: 10, major: "ریاضی" },
    { id: "u2", name: "آرش کریمی", email: "arash@example.com", role: "teacher", phone: "09120000002" },
    { id: "u3", name: "مدیر سیستم", email: "sinaeraeisi@gmail.com", role: "admin", phone: "09120000003" },
    { id: "u4", name: "نیلوفر احمدی", email: "niloofar@example.com", role: "student", phone: "09120000004", grade: 12, major: "تجربی" },
    { id: "u5", name: "مهسا رضایی", email: "mahsa@example.com", role: "teacher", phone: "09120000005" },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u
    })
  }

  console.log('✅ کاربران با موفقیت ساخته شدند!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })