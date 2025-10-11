export const SOCKET_CONFIG = {
  namespace: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
};

export const CONVERSATION_MESSAGE = {
  JOIN: 'conversations:join',
  LEAVE: 'conversations:leave',
};

export const CHAT_MESSAGE = {
  SEND: 'chat:send',
  EDIT: 'chat:edit',
  STATUS_MESSAGE: 'chat:status_message',
  REACTION: 'chat:reaction',
  READ: 'chat:read',
  TYPING: 'chat:typing',
  STOP_TYPING: 'chat:stop_typing',
};
