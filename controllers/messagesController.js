const prisma = require('../prisma/index');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const allGeneralMessagesGet = async (req, res) => {
  const generalChat = await prisma.chatRoom.findFirst({
    where: { name: 'General Chat' },
  });

  const messages = await prisma.message.findMany({
    where: {
      chatRoomId: generalChat.id,
    },
    include: {
      author: true,
    }
  });

  return res.json({ message: 'List of all general messages fetched successfully', messages });
};

const createMessagePost = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1024 }).withMessage(`Message must be between 1 and 1024 characters`)
    .escape(),
  async (req, res) => {
    const { id: userId, text, guestName } = req.body;
    const { id: chatRoomId } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: `Error creating a new message for chatRoom with id: ${chatRoomId}`, errors: errors.array() });
    } else {
      try {
        if (userId && guestName){
          throw new Error('Message cannot have both authorId and guestName');
        }

        if (!userId && !guestName) {
          throw new Error('Message must have either authorId or guestName');
        }
        
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: parseInt(chatRoomId) },
          include: { members: true },
        });
        
        if (!chatRoom) {
          return res.status(404).json({ message: `chatRoom with id ${chatRoomId} not found` });
        }

        // User must be a member of the chatRoom before commenting
        if (userId) {
          const allowed = chatRoom.members.some((user) => user.id == userId);

          if (!allowed) {
            return res.status(403).json({ message: `Can't comment on chatRooms that you don't participate` });
          }
        }

        // Guests can only comment in General Chat
        if (guestName && chatRoom.name !== 'General Chat')
          return res.status(403).json({ message: ' Guests can only comment on General Chat' });

        const newMessage = await prisma.message.create({
          data: {
            text,
            authorId: userId ? parseInt(userId, 10) : null,
            guestName: userId ? null : (guestName || null),
            chatRoomId: chatRoom.id,
          }
        });
  
        return res.status(201).json({ message: `New message for chatRoom with id: ${chatRoomId} created`, newMessage });

      } catch (err) {
        console.error('Failed to create message with prisma');
        return res.status(500).json({ message: `Server error creating message`, error: err.message });
      }
    }
  }
]

const updateMessagePatch = [
  passport.authenticate('jwt', { session: false }),
  body('text')
    .trim()
    .isLength({ min: 1, max: 1024 }).withMessage(`Message must be between 1 and 1024 characters`)
    .escape(),
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: `Error patching message with id: ${id}`, errors: errors.array() });
    } else {
      try {
        const oldMessage = await prisma.message.findUnique({
          where: { id: parseInt(id, 10) },
        });

        if (!oldMessage) {
          return res.status(404).json({ message: `Message with id: ${id} not found` });
        }

        if (oldMessage.authorId != req.user.id) {
          return res.status(403).json({ message: `You are not authorized to edit this message`});
        }

        const { text } = req.body;

        await prisma.message.update({
          where: { id: parseInt(id, 10) },
          data: { text },
        });

        return res.status(200).json({ message: `Message with id: ${id} was successfully patched` });

      } catch (err) {
        console.error('Prisma failed to patch message');
        return res.status(500).json({ message: `Server error patching message`, error: err.message });
      }
    }
  }
];

module.exports = {
  allGeneralMessagesGet,
  createMessagePost,
  updateMessagePatch,
}
