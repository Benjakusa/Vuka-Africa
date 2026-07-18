import { Search, User } from 'lucide-react';
import { Contact } from '@/services/messageService';

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
}

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
}: ContactListProps) {
  const filtered = contacts.filter((c) => c.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-dark mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body-foreground" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-btn text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-body">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-body">No contacts found</div>
        ) : (
          filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelect(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-btn text-left transition-colors ${
                selectedId === contact.id ? 'bg-primary/10' : 'hover:bg-surface'
              }`}
            >
              <div className="relative">
                {contact.avatarUrl ? (
                  <img src={contact.avatarUrl} alt={contact.fullName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                    <User size={20} className="text-body-foreground" />
                  </div>
                )}
                {contact.unreadCount && contact.unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {contact.unreadCount}
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark truncate">{contact.fullName}</p>
                <p className="text-xs text-body capitalize">{contact.role.toLowerCase()}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
