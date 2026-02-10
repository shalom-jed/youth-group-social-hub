import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Member, generateId } from '../store';
import { Send, Trash2 } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  members: Member[];
  currentUser: Member;
  onSendMessage: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
}

export default function Chat({ messages = [], members, currentUser, onSendMessage, onDelete }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;

    onSendMessage({
      id: generateId(),
      text: text.trim(),
      senderId: currentUser.id,
      createdAt: Date.now(),
    });
    setText('');
  };

  const getMember = (id: string) => members.find(m => m.id === id);
  const sortedMessages = [...safeMessages].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        )}
        
        {sortedMessages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = getMember(msg.senderId);
          const showAvatar = i === 0 || sortedMessages[i - 1].senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 flex-shrink-0 text-center">
                {showAvatar && !isMe && <span className="text-xl">{sender?.avatar}</span>}
              </div>

              <div className={`relative max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-primary-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {!isMe && showAvatar && (
                  <p className="text-[10px] font-bold text-primary-600 mb-0.5">{sender?.name}</p>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>

              {/* DELETE BUTTON (Always visible for sender) */}
              {isMe && (
                <button 
                  onClick={() => onDelete(msg.id)}
                  // Changed: Removed opacity-0 so it is always visible on mobile
                  className="p-2 text-gray-300 hover:text-red-500 active:text-red-500 transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}