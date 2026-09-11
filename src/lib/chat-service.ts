import { ChatMessage } from '@/types';
import { createClient } from '@/lib/supabase/client';

export const INITIAL_COORDINATION_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-msg-1',
    chat_id: 'chat-seed',
    sender_id: 'collector-c201',
    text: 'Hello! I have accepted your pickup request. I will be there by 5:30 PM.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'seed-msg-2',
    chat_id: 'chat-seed',
    sender_id: 'user-h101',
    text: 'Great! The recyclables are packed and ready near the gate.',
    created_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'seed-msg-3',
    chat_id: 'chat-seed',
    sender_id: 'collector-c201',
    text: 'Perfect. I am about 15 minutes away. See you soon! 🚛',
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
];

export function normalizeRequestId(requestId: string): string {
  if (!requestId || requestId === 'default' || requestId === 'demo') return 'req-map-001';
  if (requestId === 'req-map-' || requestId === 'req-map') return 'req-map-001';
  return requestId;
}

function getStorageKey(requestId: string): string {
  const cleanId = normalizeRequestId(requestId);
  return `scrapmax_chat_messages_${cleanId}`;
}

const channelsMap = new Map<string, BroadcastChannel>();

function getBroadcastChannel(requestId: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  const cleanId = normalizeRequestId(requestId);
  const name = `scrapmax_chat_channel_${cleanId}`;
  if (!channelsMap.has(name)) {
    try {
      channelsMap.set(name, new BroadcastChannel(name));
    } catch {
      return null;
    }
  }
  return channelsMap.get(name) || null;
}

export function getChatMessages(requestId: string): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_COORDINATION_MESSAGES;
  try {
    const key = getStorageKey(requestId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed default messages if not yet initialized
    localStorage.setItem(key, JSON.stringify(INITIAL_COORDINATION_MESSAGES));
    return INITIAL_COORDINATION_MESSAGES;
  } catch {
    return INITIAL_COORDINATION_MESSAGES;
  }
}

export function saveChatMessage(requestId: string, message: ChatMessage): ChatMessage[] {
  if (typeof window === 'undefined') return [message];
  try {
    const key = getStorageKey(requestId);
    const existing = getChatMessages(requestId);
    // Prevent duplicates by id
    const exists = existing.some((m) => m.id === message.id);
    const updated = exists ? existing : [...existing, message];

    localStorage.setItem(key, JSON.stringify(updated));

    // Broadcast across tabs using persistent BroadcastChannel
    const bc = getBroadcastChannel(requestId);
    if (bc) {
      try {
        bc.postMessage({
          type: 'NEW_MESSAGE',
          requestId: normalizeRequestId(requestId),
          message,
          allMessages: updated,
        });
      } catch {}
    }

    // Dispatch DOM custom event for same-tab / same-window instant listeners
    window.dispatchEvent(
      new CustomEvent('scrapmax_chat_sync', {
        detail: { requestId: normalizeRequestId(requestId), message, allMessages: updated },
      })
    );

    return updated;
  } catch {
    return [message];
  }
}

export function subscribeToChat(
  requestId: string,
  onNewMessages: (messages: ChatMessage[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const cleanId = normalizeRequestId(requestId);
  const bc = getBroadcastChannel(requestId);

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.requestId === cleanId) {
      if (event.data.allMessages) {
        onNewMessages(event.data.allMessages);
      } else {
        onNewMessages(getChatMessages(requestId));
      }
    }
  };

  if (bc) {
    bc.addEventListener('message', handleBroadcast);
  }

  // Cross-tab / cross-window storage event listener
  const handleStorage = (e: StorageEvent) => {
    if (e.key === getStorageKey(requestId) && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          onNewMessages(parsed);
        }
      } catch {}
    }
  };

  // Same-window custom event listener
  const handleCustomSync = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.requestId === cleanId && customEvent.detail?.allMessages) {
      onNewMessages(customEvent.detail.allMessages);
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('scrapmax_chat_sync', handleCustomSync);

  // Also listen to Supabase Realtime if Supabase is connected
  let supabaseChannel: any = null;
  try {
    const supabase = createClient();
    supabaseChannel = supabase
      .channel(`chat_realtime_${cleanId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg && newMsg.text) {
            const updated = saveChatMessage(requestId, newMsg);
            onNewMessages(updated);
          }
        }
      )
      .subscribe();
  } catch {}

  return () => {
    if (bc) {
      bc.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('scrapmax_chat_sync', handleCustomSync);
    if (supabaseChannel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(supabaseChannel);
      } catch {}
    }
  };
}

export async function sendChatMessage(
  requestId: string,
  senderId: string,
  text: string,
  senderRole: 'household' | 'collector' = 'household'
): Promise<ChatMessage> {
  const cleanId = normalizeRequestId(requestId);
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    chat_id: `chat-${cleanId}`,
    sender_id: senderId,
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  // 1. Instantly save locally & broadcast across all windows/tabs
  saveChatMessage(requestId, newMsg);

  // 2. Persist to Supabase if connected
  try {
    const supabase = createClient();
    await supabase.from('messages').insert({
      chat_id: `chat-${cleanId}`,
      sender_id: senderId,
      text: text.trim(),
    });
  } catch {}

  return newMsg;
}
