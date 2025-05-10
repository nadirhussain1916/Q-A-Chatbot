import React from 'react';
import '../Sidebar.css';

function Sidebar({ threads, activeThreadId, onSelectThread, onNewThread, onDeleteThread }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getActiveThreadTitle = () => {
    const activeThread = threads.find(t => t.id === activeThreadId);
    return activeThread ? activeThread.title : 'New Chat';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Your Conversations</span>
      </div>
      
      <div className="threads-list">
        {threads.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--light-text)', textAlign: 'center' }}>
            No conversations yet
          </div>
        ) : (
          threads.map(thread => (
            <div 
              key={thread.id} 
              className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <span className="thread-title">
                {thread.title}
                {thread.lastActive && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--light-text)',
                    display: 'block',
                    marginTop: '3px'
                  }}>
                    {formatDate(thread.lastActive)}
                  </span>
                )}
              </span>
              <button 
                className="thread-delete" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
      
      <button className="new-thread-btn" onClick={onNewThread}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Chat
      </button>
    </div>
  );
}

export default Sidebar;