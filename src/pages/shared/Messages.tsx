import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getContacts, getMessages, sendMessage, markAsRead, Contact } from '@/services/messageService';
import { messageKeys } from '@/lib/query-keys';
import { ContactList } from '@/components/messaging/contact-list';
import { ChatWindow } from '@/components/messaging/chat-window';

export default function Messages() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: messageKeys.contacts(user?.id),
    queryFn: () => getContacts(user!.id, user!.role),
    enabled: !!user?.id,
  });

  // Fetch messages for selected contact
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: messageKeys.chat(user?.id, selectedContact?.id),
    queryFn: () => getMessages(user!.id, selectedContact!.id),
    enabled: !!user?.id && !!selectedContact?.id,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(user!.id, selectedContact!.id, content),
    onSuccess: () => {
      // Optimistically update or just invalidate
      queryClient.invalidateQueries({ queryKey: messageKeys.chat(user!.id, selectedContact!.id) });
      queryClient.invalidateQueries({ queryKey: messageKeys.contacts(user!.id) });
    },
  });

  // Mark as read when selecting a contact or when new messages arrive
  useEffect(() => {
    if (user?.id && selectedContact?.id && messages?.length) {
      const hasUnread = messages.some((m) => m.receiverId === user.id && !m.isRead);
      if (hasUnread) {
        markAsRead(user.id, selectedContact.id).then(() => {
          queryClient.invalidateQueries({ queryKey: messageKeys.contacts(user.id) });
          queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(user.id) });
        });
      }
    }
  }, [user?.id, selectedContact?.id, messages, queryClient]);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-card shadow-card overflow-hidden border border-border">
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex-shrink-0 ${selectedContact ? 'hidden md:block' : 'block'}`}>
        <ContactList
          contacts={contacts || []}
          selectedId={selectedContact?.id || null}
          onSelect={setSelectedContact}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={contactsLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact && (
          <div className="md:hidden p-3 border-b border-border bg-surface text-sm">
            <button onClick={() => setSelectedContact(null)} className="text-primary font-medium">
              &larr; Back to contacts
            </button>
          </div>
        )}
        <ChatWindow
          currentUserId={user!.id}
          contact={selectedContact}
          messages={messages || []}
          isLoading={messagesLoading}
          onSendMessage={async (content) => {
            await sendMutation.mutateAsync(content);
          }}
        />
      </div>
    </div>
  );
}
