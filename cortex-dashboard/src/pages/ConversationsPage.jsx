import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MessageSquare, RefreshCw, ChevronDown, Trash2,
  Loader, Hash, FileText, Clock
} from 'lucide-react';
import './ConversationsPage.css';

const PLATFORM_NAMES = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  copilot: 'Copilot',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function parseMessages(content) {
  if (!content) return [];
  // Split on double newlines to get individual messages
  const blocks = content.split(/\n\n+/);
  return blocks
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return null;
      const userMatch = trimmed.match(/^\[User\]:\s*([\s\S]*)$/);
      if (userMatch) return { role: 'user', text: userMatch[1].trim() };
      const aiMatch = trimmed.match(/^\[([\w\s]+)\]:\s*([\s\S]*)$/);
      if (aiMatch) return { role: 'ai', label: aiMatch[1], text: aiMatch[2].trim() };
      // Fallback — treat as AI response
      return { role: 'ai', label: 'AI', text: trimmed };
    })
    .filter(Boolean);
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);

  const fetchConversations = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    const data = await api.getConversations();
    setConversations(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleExpand = async (conv) => {
    if (expandedId === conv.id) {
      setExpandedId(null);
      setExpandedContent(null);
      return;
    }
    setExpandedId(conv.id);
    const full = await api.getConversation(conv.id);
    setExpandedContent(full);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await api.deleteConversation(id);
    if (ok) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedContent(null);
      }
    }
  };

  const messages = expandedContent ? parseMessages(expandedContent.content) : [];

  return (
    <div className="conversations-page">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-title-wrap">
          <MessageSquare size={20} color="#7c6aff" />
          <div>
            <h1 className="cp-title">Extracted Conversations</h1>
            <p className="cp-sub">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} captured from AI platforms
            </p>
          </div>
        </div>
        <div className="cp-actions">
          <button
            className={`cp-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchConversations(false)}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="cp-loading">
          <Loader size={18} />
          Loading conversations…
        </div>
      )}

      {/* Empty State */}
      {!loading && conversations.length === 0 && (
        <div className="cp-empty">
          <div className="cp-empty-icon">
            <MessageSquare size={28} />
          </div>
          <h3>No conversations yet</h3>
          <p>
            Open Claude, ChatGPT, or Gemini in your browser and click
            <strong> "Extract Current Conversation"</strong> in the CORTEX extension to capture chats here.
          </p>
        </div>
      )}

      {/* Conversation Cards */}
      {!loading && conversations.length > 0 && (
        <div className="cp-grid">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-card ${expandedId === conv.id ? 'expanded' : ''}`}
              data-platform={conv.platform}
              onClick={() => handleExpand(conv)}
            >
              <div className="conv-card-header">
                <div className="conv-card-left">
                  <span className={`conv-platform-badge ${conv.platform}`}>
                    {conv.title || PLATFORM_NAMES[conv.platform] || conv.platform}
                  </span>
                  <span className="conv-time">
                    <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {timeAgo(conv.extracted_at)}
                  </span>
                </div>
                <div className="conv-card-right">
                  <div className="conv-stats">
                    <span className="conv-stat">
                      <Hash size={11} />
                      {conv.message_count} msgs
                    </span>
                    <span className="conv-stat">
                      <FileText size={11} />
                      {conv.char_count.toLocaleString()} chars
                    </span>
                  </div>
                  <button
                    className="conv-delete-btn"
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="conv-expand-icon">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="conv-preview">{conv.preview}</div>

              {/* Expanded: Full conversation */}
              {expandedId === conv.id && expandedContent && (
                <div className="conv-full-content">
                  {messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div key={i} className={`conv-message ${msg.role}`}>
                        <div className="conv-message-role">
                          {msg.role === 'user' ? 'You' : msg.label || 'AI'}
                        </div>
                        {msg.text}
                      </div>
                    ))
                  ) : (
                    <div className="conv-message ai">
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                        {expandedContent.content}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
