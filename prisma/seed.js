const prisma = require('./index');
const bcrypt = require('bcryptjs');

async function main() {
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('password123', 10);

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      password: hashedPassword1,
      role: 'user',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      password: hashedPassword2,
      role: 'user',
    },
  });

  // Create general chat room
  const chatRoom = await prisma.chatRoom.create({
    data: {
      name: 'General Chat',
      isPrivate: false,
      members: {
        connect: [
          { id: user1.id },
          { id: user2.id },
        ],
      },
    },
  });

  // Create messages
  await prisma.message.create({
    data: {
      text: 'Hello, this is a message from user1',
      chatRoomId: chatRoom.id,
      authorId: user1.id,
    },
  });

  await prisma.message.create({
    data: {
      text: 'Hi, this is a reply from user2',
      chatRoomId: chatRoom.id,
      authorId: user2.id,
    },
  });

  // Set up following relationship
  await prisma.user.update({
    where: { id: user1.id },
    data: {
      following: {
        connect: { id: user2.id },
      },
    },
  });

  await prisma.user.update({
    where: { id: user2.id },
    data: {
      followers: {
        connect: { id: user1.id },
      },
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
