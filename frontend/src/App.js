import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import { getThreads, saveThread, deleteThread, createThread, updateThreadMessages } from './services/threadService';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  
  // Generate a unique user ID if not already set
  const [userId] = useState(() => {
    const savedUserId = localStorage.getItem('chatbot_user_id');
    if (savedUserId) return savedUserId;
    
    const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatbot_user_id', newUserId);
    return newUserId;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load threads on initial render
  useEffect(() => {
    const loadedThreads = getThreads();
    setThreads(loadedThreads);
    
    // If there are threads, select the most recently active one
    if (loadedThreads.length > 0) {
      const sortedThreads = [...loadedThreads].sort(
        (a, b) => new Date(b.lastActive) - new Date(a.lastActive)
      );
      selectThread(sortedThreads[0].id);
    } else {
      // If no threads exist, create a new one
      handleNewThread();
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus on input whenever thread changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [threadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectThread = (id) => {
    const thread = threads.find(t => t.id === id);
    if (thread) {
      setThreadId(id);
      setMessages(thread.messages || []);
      setError(null);
    }
  };

  const handleNewThread = () => {
    const newThread = createThread();
    setThreads(prevThreads => [newThread, ...prevThreads]);
    selectThread(newThread.id);
    setInput('');
  };

  const handleDeleteThread = (id) => {
    deleteThread(id);
    setThreads(prevThreads => prevThreads.filter(t => t.id !== id));
    
    // If the deleted thread was active, select another thread or create a new one
    if (id === threadId) {
      const remainingThreads = threads.filter(t => t.id !== id);
      if (remainingThreads.length > 0) {
        selectThread(remainingThreads[0].id);
      } else {
        handleNewThread();
      }
    }
  };

  const formatMessageContent = (content) => {
    // Simple implementation to detect and format code blocks
    // This could be extended with a proper markdown parser like marked.js
    if (!content.includes('```')) return content;
    
    const parts = content.split(/```(.*?)\n([\s\S]*?)```/g);
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        return part;
      } else if (index % 3 === 1) {
        // Language
        return '';
      } else {
        // Code block
        return (
          <pre key={index} style={{
            backgroundColor: '#f6f8fa',
            padding: '12px',
            borderRadius: '6px',
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            margin: '8px 0'
          }}>
            <code>
              {part}
            </code>
          </pre>
        );
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    
    // Add user message to UI immediately
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    
    // Update thread in local storage
    const currentThread = threads.find(t => t.id === threadId);
    if (currentThread) {
      const updatedTitle = currentThread.title === 'New Chat' ? 
        userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '') : 
        currentThread.title;
      
      updateThreadMessages(threadId, updatedMessages);
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === threadId 
            ? { 
                ...t, 
                messages: updatedMessages, 
                lastActive: new Date().toISOString(),
                title: updatedTitle
              }
            : t
        )
      );
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const data = await response.json();
      
      // Update messages with the full history
      setMessages(data.history);
      
      // Save the thread ID for continuing the conversation
      setThreadId(data.thread_id);
      
      // Update thread in local storage
      updateThreadMessages(threadId, data.history);
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === threadId 
            ? { ...t, messages: data.history, lastActive: new Date().toISOString() }
            : t
        )
      );
      
    } catch (err) {
      setError(err.message);
      const errorMessages = [...updatedMessages, { role: 'assistant', content: `Error: ${err.message}. Please try again.` }];
      setMessages(errorMessages);
      
      // Update thread in local storage with error message
      updateThreadMessages(threadId, errorMessages);
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === threadId 
            ? { ...t, messages: errorMessages, lastActive: new Date().toISOString() }
            : t
        )
      );
    } finally {
      setIsLoading(false);
      // Focus back on input after sending message
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Chatbot</h1>
      </header>
      
      <div className="main-content">
        <Sidebar 
          threads={threads} 
          activeThreadId={threadId}
          onSelectThread={selectThread}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
        />
        
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>👋 Hello! How can I help you today?</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    {typeof message.content === 'string' ? 
                      formatMessageContent(message.content) : 
                      message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-content loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <span className="loading-text">Sending...</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;