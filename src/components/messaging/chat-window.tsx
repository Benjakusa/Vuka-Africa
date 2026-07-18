import { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2 } from 'lucide-react';
import { Contact, Message } from '@/services/messageService';
import { formatDateTime } from '@/lib/utils';

interface ChatWindowProps {
  currentUserId: string;
  contact: Contact | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatWindow({ currentUserId, contact, messages, isLoading, onSendMessage }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-body p-4 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Send size={24} className="text-body-foreground" />
        </div>
        <h2 className="text-xl font-bold text-dark mb-2">Your Messages</h2>
        <p className="max-w-sm">Select a contact from the sidebar to start a conversation.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(input.trim());
      setInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-white z-10">
        {contact.avatarUrl ? (
          <img src={contact.avatarUrl} alt={contact.fullName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
            <User size={20} className="text-body-foreground" />
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-dark">{contact.fullName}</h3>
          <p className="text-xs text-body capitalize">{contact.role.toLowerCase()}</p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/30">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-body py-8">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] md:max-w-[70%] p-3 rounded-2xl ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white border border-border text-dark rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
                <span className="text-[10px] text-body-foreground mt-1 mx-1">{formatDateTime(msg.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${contact.fullName.split(' ')[0]}...`}
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
