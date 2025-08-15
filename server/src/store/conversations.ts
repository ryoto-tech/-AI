type Conversation = {
  conversation_id: string;
  child_id: string;
  question_text: string;
  answer_text: string;
  audio_file_urls: { input?: string; output?: string };
  category: string;
  timestamp: string;
  session_id?: string;
};

const conversations: Conversation[] = [];

export function addConversation(c: Conversation) { conversations.push(c); }
export function listConversations(child_id: string, limit = 20): Conversation[] { return conversations.filter(c => c.child_id === child_id).slice(-limit).reverse(); }
