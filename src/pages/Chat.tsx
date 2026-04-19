import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getRoomMembers,
  getRoomMessages,
  getUserRooms,
  markRoomRead,
  sendMessage,
  subscribeToRoomMessages,
  type ChatMessage,
  type ChatRoom,
  type RoomMember,
} from '../services/chatService';
import { cn } from '../lib/utils';

function timeLabel(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const d = new Date(normalized);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function MiniAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className="h-6 w-6 shrink-0 rounded-full object-cover border border-[var(--border)]" />;
  }
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[9px] font-bold text-[var(--primary-dark)]">
      {initials}
    </div>
  );
}

function RoomAvatar({ name, isGroup }: { name?: string; isGroup?: boolean }) {
  if (isGroup) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[var(--primary-dark)]">
        <Users size={18} strokeWidth={2} />
      </div>
    );
  }
  const initials = (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[13px] font-bold text-[var(--primary-dark)]">
      {initials}
    </div>
  );
}

function RoomListItem({ room, selected, onClick }: { room: ChatRoom; selected: boolean; onClick: () => void }) {
  const displayName = room.isGroup ? (room.name ?? 'Group Chat') : (room.otherSocietyName ?? room.name ?? 'Unknown');
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-3 text-left transition',
        selected ? 'bg-[var(--primary-subtle)]' : 'hover:bg-[var(--bg-light)]',
      )}
    >
      <div className="relative">
        <RoomAvatar name={displayName} isGroup={room.isGroup} />
        {room.hasUnread && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[var(--primary)] ring-2 ring-[var(--bg)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn('truncate text-[14px]', selected || room.hasUnread ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-mid)]')}>
            {displayName}
          </p>
          {room.isGroup && (
            <span className="shrink-0 rounded-full bg-[var(--primary-subtle)] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[var(--primary-dark)]">
              Group
            </span>
          )}
        </div>
        {room.lastMessage && (
          <p className="truncate text-[12px] text-[var(--text-light)]">{room.lastMessage}</p>
        )}
      </div>
      {room.lastMessageAt && (
        <span className="shrink-0 text-[11px] text-[var(--text-light)]">{timeLabel(room.lastMessageAt)}</span>
      )}
    </button>
  );
}

function GroupMembersRow({ members }: { members: RoomMember[] }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
      {members.map((m) => (
        <div key={m.userId} className="flex shrink-0 items-center gap-1.5">
          <MiniAvatar name={m.societyName} logoUrl={m.logoUrl} />
          <span className="text-[12px] text-[var(--text-light)]">{m.societyName}</span>
        </div>
      ))}
    </div>
  );
}

export function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get('room');

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showThread, setShowThread] = useState(!!initialRoomId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserRooms().then((r) => {
      setRooms(r);
      setLoadingRooms(false);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedRoomId) return;

    setLoadingMessages(true);
    setMessages([]);
    setRoomMembers([]);

    getRoomMessages(selectedRoomId).then((msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
    if (selectedRoom?.isGroup) {
      getRoomMembers(selectedRoomId).then(setRoomMembers);
    }

    markRoomRead(selectedRoomId).then(() => {
      setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, hasUnread: false } : r)));
    });

    unsubRef.current?.();
    unsubRef.current = subscribeToRoomMessages(selectedRoomId, (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderId !== user?.id) {
        markRoomRead(selectedRoomId);
        setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, lastMessage: msg.content, lastMessageAt: msg.createdAt, hasUnread: false } : r)));
      } else {
        setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, lastMessage: msg.content, lastMessageAt: msg.createdAt } : r)));
      }
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [selectedRoomId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowThread(true);
  };

  const handleSend = async () => {
    if (!selectedRoomId || !inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    await sendMessage(selectedRoomId, text);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomName = selectedRoom?.isGroup
    ? (selectedRoom.name ?? 'Group Chat')
    : (selectedRoom?.otherSocietyName ?? selectedRoom?.name ?? 'Chat');

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-light)]">
        Please log in to use chat.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-60px)] max-w-[1100px] overflow-hidden">
      {/* Sidebar */}
      <aside className={cn('flex w-full flex-col border-r border-[var(--border)] bg-[var(--bg)] md:w-[300px] md:flex', showThread ? 'hidden md:flex' : 'flex')}>
        <div className="border-b border-[var(--border)] px-4 py-4">
          <h2 className="text-[16px] font-bold text-[var(--text)]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingRooms ? (
            <p className="px-3 py-4 text-[13px] text-[var(--text-light)]">Loading...</p>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <MessageSquare size={32} className="text-[var(--text-light)] opacity-40" />
              <p className="text-[13px] text-[var(--text-light)]">
                No conversations yet. Accept a collab request to start chatting!
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomListItem key={room.id} room={room} selected={room.id === selectedRoomId} onClick={() => handleSelectRoom(room.id)} />
            ))
          )}
        </div>
      </aside>

      {/* Thread panel */}
      <div className={cn('flex flex-1 flex-col bg-[var(--bg)]', showThread ? 'flex' : 'hidden md:flex')}>
        {!selectedRoomId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <MessageSquare size={40} className="text-[var(--text-light)] opacity-30" />
            <p className="text-[15px] font-medium text-[var(--text-light)]">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3">
              <button
                onClick={() => setShowThread(false)}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-light)] transition hover:bg-[var(--bg-light)] hover:text-[var(--text)] md:hidden"
              >
                <ArrowLeft size={18} />
              </button>
              <RoomAvatar name={selectedRoomName} isGroup={selectedRoom?.isGroup} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-[var(--text)]">{selectedRoomName}</p>
                {selectedRoom?.isGroup && roomMembers.length > 0 ? (
                  <div className="mt-1">
                    <GroupMembersRow members={roomMembers} />
                  </div>
                ) : selectedRoom?.otherUserId ? (
                  <button
                    onClick={() => navigate(`/society/${selectedRoom.otherUserId}`)}
                    className="text-[12px] text-[var(--primary-dark)] transition hover:underline"
                  >
                    View profile
                  </button>
                ) : null}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMessages ? (
                <p className="text-center text-[13px] text-[var(--text-light)]">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[13px] text-[var(--text-light)]">No messages yet. Say hello!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg, i) => {
                    const isOwn = msg.senderId === user.id;
                    const showTime =
                      i === 0 ||
                      new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 5 * 60 * 1000;
                    const senderMember = selectedRoom?.isGroup && !isOwn
                      ? roomMembers.find((m) => m.userId === msg.senderId)
                      : null;

                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <p className="my-2 text-center text-[11px] text-[var(--text-light)]">{timeLabel(msg.createdAt)}</p>
                        )}
                        <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                          {senderMember && (
                            <MiniAvatar name={senderMember.societyName} logoUrl={senderMember.logoUrl} />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                            {senderMember && (
                              <span className="px-1 text-[11px] text-[var(--text-light)]">{senderMember.societyName}</span>
                            )}
                            <div
                              className={cn(
                                'w-fit max-w-[65%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed break-words',
                                isOwn
                                  ? 'rounded-br-sm bg-[var(--primary)] text-white'
                                  : 'rounded-bl-sm bg-[var(--bg-light)] text-[var(--text)]',
                              )}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border)] px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-2.5 text-[14px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(232,160,69,0.12)] max-h-[120px]"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--text-light)]">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
