import { supabase } from '../lib/supabase';

export interface ChatRoom {
  id: string;
  isGroup: boolean;
  name?: string;
  otherUserId?: string;
  otherSocietyName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  hasUnread: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface RoomMember {
  userId: string;
  societyName: string;
  logoUrl?: string;
}

export async function getOrCreateDMRoom(
  otherUserId: string,
  initialMessage?: string,
  initialSenderId?: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_dm_room', {
    other_user_id: otherUserId,
    initial_message: initialMessage || null,
    initial_sender_id: initialSenderId || null,
  });
  if (error) { console.error('create_dm_room error:', error); return null; }
  return data as string;
}

export async function getOrCreateListingRoom(
  listingId: string,
  listingTitle: string,
  newMemberId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_or_create_listing_room', {
    p_listing_id: listingId,
    p_listing_title: listingTitle,
    p_new_member_id: newMemberId,
  });
  if (error) { console.error('get_or_create_listing_room error:', error); return null; }
  return data as string;
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data: members } = await supabase
    .from('chat_room_members')
    .select('user_id')
    .eq('room_id', roomId);

  if (!members?.length) return [];

  const userIds = members.map((m: any) => m.user_id as string);
  const { data: societies } = await supabase
    .from('societies')
    .select('user_id, name, logo_image_url')
    .in('user_id', userIds);

  const societyMap = new Map((societies || []).map((s: any) => [s.user_id, s]));

  return userIds.map((uid) => {
    const s = societyMap.get(uid);
    return {
      userId: uid,
      societyName: s?.name ?? 'Unknown',
      logoUrl: s?.logo_image_url ?? undefined,
    };
  });
}

export async function getUserRooms(): Promise<ChatRoom[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: memberships, error } = await supabase
    .from('chat_room_members')
    .select('room_id, last_read_at, chat_rooms(id, is_group, name)')
    .eq('user_id', userData.user.id);

  if (error || !memberships?.length) return [];

  const roomIds = memberships.map((m: any) => m.room_id);

  const { data: allMembers } = await supabase
    .from('chat_room_members')
    .select('room_id, user_id')
    .in('room_id', roomIds)
    .neq('user_id', userData.user.id);

  const otherUserIds = [...new Set((allMembers || []).map((m: any) => m.user_id as string))];

  const { data: societies } = otherUserIds.length
    ? await supabase.from('societies').select('user_id, name').in('user_id', otherUserIds)
    : { data: [] };

  const societyMap = new Map((societies || []).map((s: any) => [s.user_id, s.name as string]));
  const otherMemberMap = new Map((allMembers || []).map((m: any) => [m.room_id as string, m.user_id as string]));

  const lastMessageResults = await Promise.all(
    roomIds.map(async (roomId: string) => {
      const { data } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { roomId, msg: data };
    }),
  );
  const lastMsgMap = new Map(lastMessageResults.map(({ roomId, msg }) => [roomId, msg]));

  return memberships
    .map((m: any) => {
      const room = m.chat_rooms;
      const isGroup = room?.is_group ?? false;
      const otherUserId = isGroup ? undefined : otherMemberMap.get(m.room_id);
      const lastMsg = lastMsgMap.get(m.room_id);
      const hasUnread = lastMsg
        ? new Date(lastMsg.created_at) > new Date(m.last_read_at)
        : false;
      return {
        id: m.room_id,
        isGroup,
        name: room?.name,
        otherUserId,
        otherSocietyName: otherUserId ? societyMap.get(otherUserId) : undefined,
        lastMessage: lastMsg?.content,
        lastMessageAt: lastMsg?.created_at,
        hasUnread,
      } as ChatRoom;
    })
    .sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
}

export async function getRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((m: any) => ({
    id: m.id,
    roomId: m.room_id,
    senderId: m.sender_id,
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function sendMessage(roomId: string, content: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { error } = await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: userData.user.id,
    content: content.trim(),
  });
  if (error) console.error('sendMessage error:', error);
  return !error;
}

export async function markRoomRead(roomId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from('chat_room_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userData.user.id);
}

export async function getTotalUnread(): Promise<number> {
  const rooms = await getUserRooms();
  return rooms.filter((r) => r.hasUnread).length;
}

export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (msg: ChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(`chat:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        const m = payload.new as any;
        onMessage({ id: m.id, roomId: m.room_id, senderId: m.sender_id, content: m.content, createdAt: m.created_at });
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
