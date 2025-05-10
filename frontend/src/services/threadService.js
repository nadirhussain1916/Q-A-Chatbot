const THREADS_STORAGE_KEY = 'chatbot_threads';

export const getThreads = () => {
  const threadsJSON = localStorage.getItem(THREADS_STORAGE_KEY);
  if (!threadsJSON) return [];
  
  try {
    return JSON.parse(threadsJSON);
  } catch (error) {
    console.error('Failed to parse threads from localStorage:', error);
    return [];
  }
};

export const saveThread = (thread) => {
  if (!thread || !thread.id) return null;
  
  const threads = getThreads();
  const existingThreadIndex = threads.findIndex(t => t.id === thread.id);
  
  if (existingThreadIndex >= 0) {
    threads[existingThreadIndex] = thread;
  } else {
    threads.push(thread);
  }
  
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  return thread;
};

export const deleteThread = (threadId) => {
  if (!threadId) return false;
  
  const threads = getThreads();
  const updatedThreads = threads.filter(thread => thread.id !== threadId);
  
  if (threads.length === updatedThreads.length) {
    return false;
  }
  
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updatedThreads));
  return true;
};

export const createThread = (title = '') => {
  const newThread = {
    id: `thread_${Date.now()}`,
    title: title || `Chat ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    messages: []
  };
  
  return saveThread(newThread);
};

export const updateThreadTitle = (threadId, title) => {
  if (!threadId) return null;
  
  const threads = getThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  
  if (threadIndex < 0) return null;
  
  threads[threadIndex].title = title;
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  
  return threads[threadIndex];
};

export const updateThreadMessages = (threadId, messages) => {
  if (!threadId) return null;
  
  const threads = getThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  
  if (threadIndex < 0) return null;
  
  threads[threadIndex].messages = messages;
  threads[threadIndex].lastActive = new Date().toISOString();
  
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  
  return threads[threadIndex];
};