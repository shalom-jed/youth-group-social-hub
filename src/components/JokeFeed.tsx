import { useState } from 'react';
import { JokePost, Member, generateId } from '../store';
import { Send, Sparkles, Star, Trash2, Edit2, X, Check } from 'lucide-react';

interface Props {
  posts: JokePost[];
  members: Member[];
  currentUser: Member;
  onAddPost: (post: JokePost) => void;
  onReact: (postId: string, reaction: '😂' | '❤️') => void;
  onDelete: (postId: string) => void;
  onEdit: (postId: string, newContent: string) => void;
}

export default function JokeFeed({ posts, members, currentUser, onAddPost, onReact, onDelete, onEdit }: Props) {
  const [newContent, setNewContent] = useState('');
  const [postType, setPostType] = useState<'joke' | 'meme' | 'shoutout'>('joke');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const getMember = (id: string) => members.find(m => m.id === id);
  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  const weeklyHighlight = posts.find(p => p.weeklyHighlight);

  const handleSubmit = () => {
    if (!newContent.trim()) return;
    const post: JokePost = {
      id: generateId(),
      authorId: currentUser.id,
      content: newContent.trim(),
      type: postType,
      reactions: { '😂': [], '❤️': [] },
      createdAt: Date.now(),
    };
    onAddPost(post);
    setNewContent('');
  };

  const startEditing = (post: JokePost) => {
    setEditingId(post.id);
    setEditContent(post.content);
  };

  const saveEdit = (postId: string) => {
    if (!editContent.trim()) return;
    onEdit(postId, editContent.trim());
    setEditingId(null);
    setEditContent('');
  };

  // --- FIXED TYPO HERE ---
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts; 
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const typeLabels = { joke: '😜 Joke', meme: '🎭 Meme', shoutout: '📣 Shoutout' };

  return (
    <div className="space-y-4 pb-4">
      {/* Weekly Highlight */}
      {weeklyHighlight && (
        <div className="mx-4 bg-gradient-to-r from-accent-400/20 to-warm-400/20 rounded-2xl p-4 border border-accent-400/30 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
            <span className="text-xs font-bold text-accent-500 uppercase tracking-wider">Funniest Post of the Week</span>
          </div>
          <p className="text-gray-800 font-medium">{weeklyHighlight.content}</p>
          <p className="text-xs text-gray-500 mt-1">— {getMember(weeklyHighlight.authorId)?.name}</p>
        </div>
      )}

      {/* Compose */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{currentUser.avatar}</span>
          <span className="font-semibold text-gray-700 text-sm">What's on your mind?</span>
        </div>
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Drop a joke, meme, or shoutout..."
          className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-gray-800 resize-none"
          rows={2}
          maxLength={200}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['joke', 'meme', 'shoutout'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  postType === t 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!newContent.trim()}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold shadow-sm hover:bg-primary-600 transition-all disabled:opacity-40 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Post
          </button>
        </div>
      </div>

      {/* Feed */}
      {sortedPosts.map((post, i) => {
        const author = getMember(post.authorId);
        const hasLaughed = post.reactions['😂'].includes(currentUser.id);
        const hasLoved = post.reactions['❤️'].includes(currentUser.id);
        const isOwner = currentUser.id === post.authorId;
        const isEditing = editingId === post.id;

        return (
          <div
            key={post.id}
            className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{author?.avatar || '👤'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{author?.name || 'Unknown'}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      post.type === 'joke' ? 'bg-yellow-100 text-yellow-700' :
                      post.type === 'meme' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {typeLabels[post.type]}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(post.createdAt)}</span>
                  </div>
                  
                  {/* Edit/Delete Actions (Only for owner) */}
                  {isOwner && !isEditing && (
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(post)} className="text-gray-400 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 animate-fade-in">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-primary-200 focus:border-primary-400 outline-none text-sm text-gray-800 resize-none"
                      rows={2}
                      maxLength={200}
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button 
                        onClick={() => setEditingId(null)} 
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button 
                        onClick={() => saveEdit(post.id)} 
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-all"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 mt-1 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.weeklyHighlight && (
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-accent-500" />
                        <span className="text-[10px] text-accent-500 font-semibold">Weekly Highlight!</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => onReact(post.id, '😂')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90 ${
                      hasLaughed ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    😂 <span>{post.reactions['😂'].length}</span>
                  </button>
                  <button
                    onClick={() => onReact(post.id, '❤️')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90 ${
                      hasLoved ? 'bg-red-100 text-red-600 ring-1 ring-red-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    ❤️ Amen <span>{post.reactions['❤️'].length}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}