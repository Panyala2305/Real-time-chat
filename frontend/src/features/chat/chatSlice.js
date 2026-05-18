import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async () => {
  const res = await api.get('/conversations');
  return res.data.conversations;
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId) => {
  const res = await api.get(`/messages/${conversationId}`);
  return { conversationId, messages: res.data.messages };
});

export const createConversation = createAsyncThunk('chat/createConversation', async (participantId) => {
  const res = await api.post('/conversations', { participantId });
  return res.data.conversation;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    activeConversationId: null,
    messages: {},      // { [conversationId]: [message, ...] }
    typingUsers: {},   // { [conversationId]: { userId: userName } }
    onlineUsers: [],   // Array of online user IDs
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action) => {
      const { message } = action.payload;

      // FIX: handle both snake_case field names
      const cid = message.conversation_id;
      if (!cid) return; // safety guard

      if (!state.messages[cid]) state.messages[cid] = [];

      // Deduplicate by ID
      const exists = state.messages[cid].some(m => m.id === message.id);
      if (!exists) {
        state.messages[cid].push(message);
      }

      // Update sidebar conversation preview
      const conv = state.conversations.find(c => c.id === cid);
      if (conv) {
        conv.last_message = message.message_text;
        conv.last_message_type = message.message_type;
        conv.last_message_time = message.created_at;
      }
    },
    setTyping: (state, action) => {
      const { conversationId, userId, userName, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = {};
      if (isTyping) {
        state.typingUsers[conversationId][userId] = userName;
      } else {
        delete state.typingUsers[conversationId][userId];
      }
    },
    setUserOnline: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
      // Update in conversations list
      state.conversations.forEach(c => {
        if (c.other_user_id === action.payload) c.is_online = 1;
      });
    },
    setUserOffline: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
      state.conversations.forEach(c => {
        if (c.other_user_id === action.payload) c.is_online = 0;
      });
    },
    markConversationRead: (state, action) => {
      const conv = state.conversations.find(c => c.id === action.payload);
      if (conv) conv.unread_count = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.activeConversationId = action.payload.id;
      });
  }
});

export const {
  setActiveConversation, addMessage, setTyping,
  setUserOnline, setUserOffline, markConversationRead
} = chatSlice.actions;

export default chatSlice.reducer;