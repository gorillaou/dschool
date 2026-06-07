const MESSAGES_KEY = "dschool_messages_v1";
const MAX_MESSAGES_PER_CHANNEL = 500;

const ChatStore = {
  loadAll() {
    try {
      return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "{}");
    } catch {
      return {};
    }
  },

  loadChannel(channel) {
    const stored = ChatStore.loadAll()[channel] || [];
    return stored.map((message) => ({
      ...message,
      time: new Date(message.time),
    }));
  },

  saveChannel(channel, messages) {
    const all = ChatStore.loadAll();
    all[channel] = messages
      .filter((message) => !message.system && !message.pending)
      .slice(-MAX_MESSAGES_PER_CHANNEL)
      .map((message) => ({
        id: message.id,
        author: message.author,
        content: message.content,
        time: message.time.toISOString(),
        failed: Boolean(message.failed),
      }));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  },
};

window.ChatStore = ChatStore;
