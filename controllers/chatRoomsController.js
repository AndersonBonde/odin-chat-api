const prisma = require('../prisma/index');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const getAllGeneralMessages = async (req, res) => {
  try {
    const generalChat = await prisma.chatRoom.findUnique({
      where: { slug: 'general' },
    });
  
    const messages = await prisma.message.findMany({
      where: { chatRoomId: generalChat.id, },
      include: { 
        author: {
          include: {
            profile: {
              select: {
                name: true,
                displayColor: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  
    return res.json({ message: 'List of all general messages fetched successfully', messages });
  } catch (err) {
    console.error('Failed to load general messages with prisma');
    return res.status(500).json({ message: 'Server error loading general messages', error: err.message });
  }
};

const postMessageOnGeneral = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1024 }).withMessage(`Message must be between 1 and 1024 characters`)
    .escape(),
  async (req, res) => {
    const { id: userId, text, guestName } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: `Error creating a new message for General Chat`, errors: errors.array() });
    } else {
      try {
        if (userId && guestName){
          return res.status(400).json({ message: `Message cannot have both authorId and guestName` });
        }

        if (!userId && !guestName) {
          return res.status(400).json({ message: `Message must have either authorId or guestName` });
        }
        
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { slug: 'general' },
        });
        
        if (!chatRoom) {
          return res.status(404).json({ message: `General Chat not found` });
        }

        const newMessage = await prisma.message.create({
          data: {
            text,
            authorId: userId ? parseInt(userId, 10) : null,
            guestName: userId ? null : (guestName || null),
            chatRoomId: chatRoom.id,
          }
        });
  
        return res.status(201).json({ message: `New message for General Chat created successfully`, newMessage });

      } catch (err) {
        console.error('Failed to create message with prisma');
        return res.status(500).json({ message: `Server error creating message`, error: err.message });
      }
    }
  }
];

module.exports = {
  getAllGeneralMessages,
  postMessageOnGeneral,
}
