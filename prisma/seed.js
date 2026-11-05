const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('در حال ساخت حساب ادمین...')
  const passwordHash = await bcrypt.hash('N3utr0n_Adm1n#99!30nA)', 10)

  await prisma.user.upsert({
    where: { email: 'sinaeraeisi@gmail.com' },
    update: { passwordHash },
    create: {
      id: 'admin-1',
      name: 'سینا رئیسی',
      email: 'sinaeraeisi@gmail.com',
      role: 'admin',
      passwordHash,
    }
  })
  
  console.log('✅ ادمین ساخته شد!')
  console.log('ایمیل: sinaeraeisi@gmail.com')
  console.log('رمز: Neutron@1405')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })