import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Member } from '../store';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';

const AVATARS = ['👦', '👧', '👨', '👩', '🧑', '🧔', '👱‍♀️', '👩‍🦰', '🧑‍🦱', '👩‍🦳', '👨‍🦲', '🧑‍🦰'];

export default function WelcomeScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Request Notification Permission immediately on user gesture
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (isLogin) {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // --- SIGN UP LOGIC ---
        if (!name.trim()) throw new Error("Please enter your name!");
        
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        const newMember: Member = {
          id: user.uid,
          name: name.trim(),
          avatar,
          xp: 0,
          badges: [],
          joinedAt: Date.now(),
        };

        await setDoc(doc(db, 'members', user.uid), newMember);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Something went wrong.";
      if (err.code === 'auth/invalid-email') msg = "That email looks wrong.";
      if (err.code === 'auth/user-not-found') msg = "No user found with that email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email is already taken.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 chars.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm mb-4 shadow-xl">
            <span className="text-4xl">⛪</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Youth Fun Hub</h1>
          <p className="text-primary-200 mt-2 text-sm">Sign in to join the crew! 🚀</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sarah J"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Choose Avatar</label>
                   <div className="flex flex-wrap gap-2 justify-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {AVATARS.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAvatar(a)}
                          className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                            avatar === a ? 'bg-white shadow-md scale-110 ring-2 ring-primary-500' : 'hover:bg-gray-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}