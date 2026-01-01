/**
 * Messages/Conversations Handler
 */

import {
  buildDetailResponse,
  buildCreateResponse,
} from '../utils';

export const list = ({ searchParams, store }) => {
  const messageData = store.getCollection('messages');
  let conversations = messageData?.conversations || [];

  // Filter by status
  if (searchParams.status) {
    conversations = conversations.filter(c => c.status === searchParams.status);
  }

  // Search by owner name or message content
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    conversations = conversations.filter(c =>
      c.ownerName?.toLowerCase().includes(search) ||
      c.lastMessage?.toLowerCase().includes(search) ||
      c.petNames?.some(p => p.toLowerCase().includes(search))
    );
  }

  // Sort by last message date descending
  conversations.sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));

  // Calculate stats
  const totalConversations = conversations.length;
  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;
  const needsReply = conversations.filter(c => c.needsReply).length;
  const sentToday = conversations.filter(c => {
    const lastMsg = new Date(c.lastMessage?.createdAt);
    const today = new Date();
    return lastMsg.toDateString() === today.toDateString() && c.lastMessage?.from === 'staff';
  }).length;

  // Return format UI expects
  return {
    data: {
      conversations,
      stats: {
        totalConversations,
        unread: unreadCount,
        needsReply,
        sentToday,
      }
    },
    status: 200,
  };
};

export const detail = ({ id, store }) => {
  const messageData = store.getCollection('messages');
  const conversations = messageData?.conversations || [];
  const allMessages = messageData?.messages || [];

  const conversation = conversations.find(c => c.id === id || c.recordId === id);
  if (!conversation) {
    return buildDetailResponse(null);
  }

  // Get messages for this conversation
  const messages = allMessages
    .filter(m => m.conversationId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    data: {
      conversation,
      messages,
    },
    status: 200,
  };
};

export const create = ({ body, store }) => {
  const messageData = store.getCollection('messages') || { conversations: [], messages: [] };

  const newMessage = {
    id: `msg-${Date.now()}`,
    conversationId: body.conversationId,
    content: body.content,
    senderType: 'staff',
    staffId: 'demo-user-001',
    staffName: 'Demo User',
    createdAt: new Date().toISOString(),
  };

  // Add message
  messageData.messages.push(newMessage);

  // Update conversation
  const convIndex = messageData.conversations.findIndex(c => c.id === body.conversationId);
  if (convIndex !== -1) {
    messageData.conversations[convIndex].lastMessage = body.content;
    messageData.conversations[convIndex].lastMessageAt = newMessage.createdAt;
    messageData.conversations[convIndex].lastMessageFrom = 'staff';
  }

  return buildCreateResponse(newMessage);
};

// Mark conversation as read
export const markRead = ({ id, store }) => {
  const messageData = store.getCollection('messages');
  if (!messageData?.conversations) {
    return { data: { error: 'Conversation not found' }, status: 404 };
  }

  const convIndex = messageData.conversations.findIndex(c => c.id === id || c.recordId === id);
  if (convIndex === -1) {
    return { data: { error: 'Conversation not found' }, status: 404 };
  }

  messageData.conversations[convIndex].unreadCount = 0;

  return { data: messageData.conversations[convIndex], status: 200 };
};

// Get unread count
export const unreadCount = ({ store }) => {
  const messageData = store.getCollection('messages');
  const conversations = messageData?.conversations || [];

  const count = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return {
    data: { count },
    status: 200,
  };
};

export default { list, detail, create, markRead, unreadCount };
