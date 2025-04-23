const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  // const chatRoom = await prisma.chatRoom.findMany();
  // const users = await prisma.user.findMany();
  // const messages = await prisma.message.findMany();

  // console.log(chatRoom, users, messages);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

module.exports = prisma;
