const prisma = require('../prisma/index');
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
    .isLength({ min: 1 }).withMessage(`Messages can't be blank`)
    .escape(),
  async (req, res) => {
    const { id: userId, text, guestName } = req.body;
    const { id: chatRoomId } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: `Error creating a new message for chatRoom with id: ${chatRoomId}`, errors: errors.array() });
    } else {
      return res.status(201).json({ message: `Creating new message for charRoom with id: ${chatRoomId} WIP` });
    }
  }
]

module.exports = {
  allGeneralMessagesGet,
  createMessagePost,
}
