const prisma = require('../prisma/index');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const allGeneralMessagesGet = async (req, res) => {
  try {
    const generalChat = await prisma.chatRoom.findUnique({
      where: { slug: 'general' },
    });
  
    const messages = await prisma.message.findMany({
      where: { chatRoomId: generalChat.id, },
      include: { author: true, },
      orderBy: { id: 'asc' },
    });
  
    return res.json({ message: 'List of all general messages fetched successfully', messages });
  } catch (err) {
    console.error('Failed to load general messages with prisma');
    return res.status(500).json({ message: 'Server error loading general messages', error: err.message });
  }
};

const createMessageOnGeneralPost = [
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

const deleteMessage = [
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { id } = req.params;

    try {
      const oldMessage = await prisma.message.findUnique({ 
        where: { id: parseInt(id, 10) },
      });

      if (!oldMessage) {
        return res.status(404).json({ message: `Message with id: ${id} not found` });
      }
      
      if (oldMessage.authorId != req.user.id) {
        return res.status(403).json({ message: `You are not authorized to delete this message`});
      }

      await prisma.message.delete({
        where: { id: parseInt(id, 10) },
      });

      res.status(200).json({ message: `Successfully deleted message with id: ${id}`});
    } catch (err) {
      console.error('Prisma failed to delete message with id: ${id}');
      return res.status(500).json({ message: `Server error deleting message with id: ${id}`, error: err.message });
    }
  }
];

module.exports = {
  allGeneralMessagesGet,
  createMessageOnGeneralPost,
  updateMessagePatch,
  deleteMessage,
}
