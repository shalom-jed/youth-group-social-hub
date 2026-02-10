import { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, 
  arrayUnion, arrayRemove, increment, getDoc, limit,
  where, getDocs, writeBatch // <--- NEW IMPORTS
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase'; 
import { AppState, Member, JokePost, GuessQuote, ChatMessage, getEmptyState } from './store';
import WelcomeScreen from './components/WelcomeScreen';
import JokeFeed from './components/JokeFeed';
import Games from './components/Games';
import Chat from './components/Chat';
import { MessageCircle, Gamepad2, LogOut, User, Loader2, MessageSquareText } from 'lucide-react';

type Tab = 'feed' | 'games' | 'chat';

const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.png' });
  }
};

export function App() {
  const [state, setState] = useState<AppState>(getEmptyState());
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const isFirstChatLoad = useRef(true);
  const isFirstFeedLoad = useRef(true);

  // 1. AUTO-DELETE OLD MESSAGES (Runs once on startup)
  useEffect(() => {
    const cleanupOldMessages = async () => {
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - ONE_WEEK_MS;

      try {
        // Find messages older than 1 week
        const q = query(collection(db, 'messages'), where('createdAt', '<', cutoff));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Delete them in a batch (efficient)
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`🧹 Auto-deleted ${snapshot.size} old messages.`);
        }
      } catch (error) {
        console.error("Auto-delete failed (might need an index):", error);
      }
    };

    cleanupOldMessages();
  }, []);

  // 2. SETUP AUTH LISTENER
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'members', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const memberData = { id: docSnap.id, ...docSnap.data() } as Member;
          setState(s => ({ ...s, currentUser: memberData }));
        }
      } else {
        setState(s => ({ ...s, currentUser: null }));
      }
      setAuthChecked(true);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 3. SETUP DATA LISTENERS
  useEffect(() => {
    if (!state.currentUser) return;

    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const members = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setState(s => ({ ...s, members }));
    });

    const unsubJokes = onSnapshot(query(collection(db, 'jokes'), orderBy('createdAt', 'desc')), (snapshot) => {
      const jokeFeed = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JokePost));
      setState(s => ({ ...s, jokeFeed }));

      if (isFirstFeedLoad.current) {
        isFirstFeedLoad.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const post = change.doc.data() as JokePost;
            if (post.authorId !== state.currentUser?.id) {
              const authorName = state.members.find(m => m.id === post.authorId)?.name || 'Someone';
              showNotification(`New Post from ${authorName}`, post.content.substring(0, 50));
            }
          }
        });
      }
    });

    const unsubChat = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100)), (snapshot) => {
      const chatMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setState(s => ({ ...s, chatMessages }));

      if (isFirstChatLoad.current) {
        isFirstChatLoad.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data() as ChatMessage;
            if (msg.senderId !== state.currentUser?.id) {
              const authorName = state.members.find(m => m.id === msg.senderId)?.name || 'Someone';
              showNotification(`New Message from ${authorName}`, msg.text);
            }
          }
        });
      }
    });

    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const guessQuotes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GuessQuote));
      setState(s => ({ ...s, guessQuotes }));
    });
    
    return () => {
      unsubMembers(); unsubJokes(); unsubQuotes(); unsubChat();
    };
  }, [state.currentUser]);

  // ACTIONS

  const handleLogout = async () => {
    await signOut(auth);
    setShowProfile(false);
  };

  const handleAddPost = async (post: JokePost) => {
    const { id, ...postData } = post;
    await addDoc(collection(db, 'jokes'), postData);
  };

  const handleDeletePost = async (postId: string) => {
    if(!confirm("Are you sure you want to delete this?")) return;
    await deleteDoc(doc(db, 'jokes', postId));
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    await updateDoc(doc(db, 'jokes', postId), { content: newContent });
  };

  const handleReact = async (postId: string, reaction: '😂' | '❤️') => {
    if (!state.currentUser) return;
    const postRef = doc(db, 'jokes', postId);
    const post = state.jokeFeed.find(p => p.id === postId);
    if (post) {
       const hasReacted = post.reactions[reaction].includes(state.currentUser.id);
       await updateDoc(postRef, {
         [`reactions.${reaction}`]: hasReacted ? arrayRemove(state.currentUser.id) : arrayUnion(state.currentUser.id)
       });
    }
  };

  const handleAddQuote = async (quote: GuessQuote) => {
      const { id, ...qData } = quote;
      await addDoc(collection(db, 'quotes'), qData);
  };

  const handleSubmitGuess = async (quoteId: string, guessedPersonId: string) => {
    if (!state.currentUser) return;
    const quoteRef = doc(db, 'quotes', quoteId);
    await updateDoc(quoteRef, {
      guesses: arrayUnion({ memberId: state.currentUser.id, guessedPersonId })
    });
  };

  const handleRevealQuote = async (quoteId: string) => {
    const quote = state.guessQuotes.find(q => q.id === quoteId);
    if (!quote) return;
    await updateDoc(doc(db, 'quotes', quoteId), { revealed: true });
    
    const winners = quote.guesses.filter(g => g.guessedPersonId === quote.actualPersonId);
    winners.forEach(winner => {
        updateDoc(doc(db, 'members', winner.memberId), { xp: increment(10) });
    });
    updateDoc(doc(db, 'members', quote.submittedBy), { xp: increment(5) });
  };

  const handleTriviaScore = async (score: number) => {
      if (!state.currentUser) return;
      const memberRef = doc(db, 'members', state.currentUser.id);
      await updateDoc(memberRef, { xp: increment(Math.floor(score / 2)) });
  };

  const handleSendMessage = async (msg: ChatMessage) => {
    const { id, ...msgData } = msg;
    await addDoc(collection(db, 'messages'), msgData);
  };

  const handleDeleteChat = async (msgId: string) => {
    if(!confirm("Delete this message?")) return;
    await deleteDoc(doc(db, 'messages', msgId));
  };

  // RENDER LOGIC

  if (!authChecked || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-primary-600 font-bold gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span>Loading Fun Hub...</span>
    </div>
  );

  if (!state.currentUser) {
    return <WelcomeScreen />;
  }

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'feed', icon: <MessageCircle className="w-5 h-5" />, label: 'Feed' },
    { id: 'chat', icon: <MessageSquareText className="w-5 h-5" />, label: 'Chat' },
    { id: 'games', icon: <Gamepad2 className="w-5 h-5" />, label: 'Games' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛪</span>
            <h1 className="font-extrabold text-gray-800 text-lg tracking-tight">Youth Fun Hub</h1>
          </div>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 hover:bg-primary-100 transition-all active:scale-95"
          >
            <span className="text-lg">{state.currentUser.avatar}</span>
            <span className="text-xs font-bold text-primary-700 hidden xs:block">{state.currentUser.name}</span>
          </button>
        </div>
      </header>

      {showProfile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
          <div className="absolute top-16 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-64 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{state.currentUser.avatar}</span>
              <div>
                <p className="font-bold text-gray-800">{state.currentUser.name}</p>
                <p className="text-xs text-primary-600 font-medium">Level {Math.floor(state.currentUser.xp / 50) + 1} • {state.currentUser.xp} XP</p>
              </div>
            </div>
            {state.currentUser.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {state.currentUser.badges.map(b => (
                  <span key={b} className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{b}</span>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 overflow-y-auto pt-4 pb-20">
        {activeTab === 'feed' && (
          <JokeFeed
            posts={state.jokeFeed}
            members={state.members}
            currentUser={state.currentUser}
            onAddPost={handleAddPost}
            onReact={handleReact}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
          />
        )}
        {activeTab === 'chat' && (
          <Chat 
            messages={state.chatMessages}
            members={state.members}
            currentUser={state.currentUser}
            onSendMessage={handleSendMessage}
            onDelete={handleDeleteChat}
          />
        )}
        {activeTab === 'games' && (
          <Games
            members={state.members}
            currentUser={state.currentUser}
            guessQuotes={state.guessQuotes}
            polls={[]} 
            triviaScores={state.triviaScores}
            onSubmitGuess={handleSubmitGuess}
            onRevealQuote={handleRevealQuote}
            onAddQuote={handleAddQuote}
            onVoteThisOrThat={() => {}}
            onAddThisOrThat={() => {}}
            onTriviaScore={handleTriviaScore}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all active:scale-90 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-primary-100' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-600' : ''}`}>{tab.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}