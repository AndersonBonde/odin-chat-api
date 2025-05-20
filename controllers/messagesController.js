const prisma = require('../prisma/index');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const patchMessage = [
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
  patchMessage,
  deleteMessage,
}
