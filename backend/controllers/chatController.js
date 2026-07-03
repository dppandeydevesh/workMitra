const User = require('../models/User');
const Application = require('../models/Application');
const Project = require('../models/Project');

exports.routeHandler0 = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    
    if (req.user.email !== user1 && req.user.email !== user2) {
      return res.status(403).json({ error: "Unauthorized access to private message history." });
    }

    const Message = require("../models/Message");
    
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    let query = Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    });

    if (page && limit) {
      const skip = (page - 1) * limit;
      // Fetch latest messages first, then reverse so they render chronologically
      const messages = await query.sort({ timestamp: -1 }).skip(skip).limit(limit);
      res.status(200).json(messages.reverse());
    } else {
      const messages = await query.sort({ timestamp: 1 });
      res.status(200).json(messages);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat history." });
  }
};

exports.routeHandler1 = async (req, res) => {
  try {
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Unauthorized access to chat rosters." });
    }

    const Message = require("../models/Message");

    // Find all unique email addresses that this user has messaged or received messages from
    const senders = await Message.distinct("sender", { receiver: email });
    const receivers = await Message.distinct("receiver", { sender: email });
    const uniqueEmails = Array.from(new Set([...senders, ...receivers]));

    // Fetch user details for each partner email
    const partners = await User.find({ email: { $in: uniqueEmails } }, "fullName email companyName userRole");
    
    const partnersWithUnread = await Promise.all(
      partners.map(async (partner) => {
        const unreadCount = await Message.countDocuments({
          sender: partner.email,
          receiver: email,
          read: false
        });
        return {
          _id: partner._id,
          fullName: partner.fullName,
          email: partner.email,
          companyName: partner.companyName,
          userRole: partner.userRole,
          unreadCount
        };
      })
    );
    
    res.status(200).json(partnersWithUnread);
  } catch (err) {
    res.status(500).json({ error: "Failed to load recent chat partners." });
  }
};

exports.routeHandler2 = async (req, res) => {
  try {
    const { sender } = req.body;
    if (!sender) {
      return res.status(400).json({ error: "Sender email is required." });
    }
    const Message = require("../models/Message");
    await Message.updateMany(
      { sender, receiver: req.user.email, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
};

