const prisma = require('../prisma/index');
const passport = require('passport');
const { body, param, validationResult } = require('express-validator');

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

const createChatRoom = [
  passport.authenticate('jwt', { session: false }),
  body('memberIds')
    .isArray({ min: 2 })
    .withMessage('memberIds must be an array with at least 2 items.'),
  body('memberIds.*')
    .isInt()
    .withMessage('Each memberId must be an integer'),
  async (req, res) => {
    const { memberIds } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingUsers = await prisma.user.findMany({
        where: {
          id: {
            in: memberIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingIds = existingUsers.map((user) => user.id);
      const allExist = memberIds.every((id) => existingIds.includes(id));

      if (!allExist) {
        return res.status(400).json({ message: `Can't create chat room with users that don't exist` });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id, 10) },
        include: {
          chatRooms: {
            include: { 
              members: true,
            },
          },
        },
      });

      const isMember = memberIds.includes(user.id);

      if (!isMember) {
        return res.status(403).json({ message: `Failed to create chat-room` });
      }

      const chatRoomAlreadyExists = user.chatRooms.some((room) => {
        const members = room.members.map((m) => m.id).sort();
        const input = [...memberIds].sort();
        return (
          members.length == input.length &&
          members.every((id, idx) => id == input[idx])
        );
      });

      if (chatRoomAlreadyExists) {
        return res.status(403).json({ message: `Chat room between memberIds already exists` });
      }

      // Map memberIds to the format prisma expects
      const connectMembers = memberIds.map((id) => ({ id }));

      const chatRoom = await prisma.chatRoom.create({
        data: {
          isPrivate: true,
          members: {
            connect: connectMembers,
          },
        },
      });

      return res.status(201).json({ message: `Chat room created successfully`, chatRoom });

    } catch (err) {
      console.error(`Failed to create chat room with prisma`);
      return res.status(500).json({ message: `Server error creating chat room`, error: err.message });
    }
  }
];

const getChatRoomMessages = [
  passport.authenticate('jwt', { session: false }),
  param('id').isInt(),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id, 10) },
        include: { chatRooms: true },
      });
      
      const isMember = user.chatRooms.some((room) => {
        return room.id == id;
      });

      if (!isMember) {
        return res.status(403).json({ message: `Unauthorized to access this resource` });
      }

      const messages = await prisma.message.findMany({
        where: { chatRoomId: parseInt(id, 10), },
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
      console.error('Failed to load chat messages with prisma');
      return res.status(500).json({ message: 'Server error loading chat messages', error: err.message });
    }
  }
];

const postChatRoomMessage = [
  passport.authenticate('jwt', { session: false }),
  body('text')
    .trim()
    .isLength({ min: 1, max: 1024 }).withMessage(`Message must be between 1 and 1024 characters`)
    .escape(),
  async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: `Error creating a new message`, errors: errors.array() });
    }

    try {        
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: parseInt(id, 10) },
      });
      
      if (!chatRoom) {
        return res.status(404).json({ message: `Chat room not found` });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.id, 10) },
        include: { chatRooms: true },
      });
      
      const isMember = user.chatRooms.some((room) => {
        return room.id == id;
      });

      if (!isMember) {
        return res.status(403).json({ message: `Unauthorized to access this resource` });
      }
      
      const newMessage = await prisma.message.create({
        data: {
          text,
          authorId: parseInt(user.id, 10),
          chatRoomId: parseInt(id, 10),
        }
      });
  
      return res.status(201).json({ message: `New message for Chat with id: ${id} created successfully`, newMessage });

    } catch (err) {
      console.error(`Failed to create message on chat room with id: ${id} with prisma`);
      return res.status(500).json({ message: `Server error creating message`, error: err.message });
    }
  }
];

module.exports = {
  getAllGeneralMessages,
  postMessageOnGeneral,
  createChatRoom,
  getChatRoomMessages,
  postChatRoomMessage,
}
