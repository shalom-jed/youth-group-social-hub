import { useState } from 'react';
import { Member, GuessQuote, Poll, TriviaQuestion, generateId, TRIVIA_QUESTIONS } from '../store';
import { Zap, HelpCircle, ArrowLeftRight, Trophy, ChevronRight, ArrowLeft, Check, X, Clock } from 'lucide-react';
import { useEffect, useCallback, useRef } from 'react';

interface Props {
  members: Member[];
  currentUser: Member;
  guessQuotes: GuessQuote[];
  polls: Poll[];
  triviaScores: Record<string, number>;
  onSubmitGuess: (quoteId: string, guessedPersonId: string) => void;
  onRevealQuote: (quoteId: string) => void;
  onAddQuote: (quote: GuessQuote) => void;
  onVoteThisOrThat: (pollId: string, optionIndex: number) => void;
  onAddThisOrThat: (poll: Poll) => void;
  onTriviaScore: (score: number) => void;
}

type GameScreen = 'menu' | 'guess' | 'thisorthat' | 'trivia' | 'leaderboard';

export default function Games({ members, currentUser, guessQuotes, polls, triviaScores, onSubmitGuess, onRevealQuote, onAddQuote, onVoteThisOrThat, onAddThisOrThat, onTriviaScore }: Props) {
  const [screen, setScreen] = useState<GameScreen>('menu');

  return (
    <div className="pb-4">
      {screen === 'menu' && <GameMenu onSelect={setScreen} />}
      {screen === 'guess' && (
        <GuessWhoGame
          members={members}
          currentUser={currentUser}
          quotes={guessQuotes}
          onGuess={onSubmitGuess}
          onReveal={onRevealQuote}
          onAddQuote={onAddQuote}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'thisorthat' && (
        <ThisOrThatGame
          polls={polls.filter(p => p.type === 'thisorthat')}
          currentUser={currentUser}
          onVote={onVoteThisOrThat}
          onAdd={onAddThisOrThat}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'trivia' && (
        <TriviaGame
          currentUser={currentUser}
          onScore={onTriviaScore}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard
          members={members}
          triviaScores={triviaScores}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  );
}

function GameMenu({ onSelect }: { onSelect: (s: GameScreen) => void }) {
  const games = [
    { id: 'guess' as const, icon: <HelpCircle className="w-6 h-6" />, title: 'Guess Who Said That', desc: 'Can you guess who dropped this quote?', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
    { id: 'thisorthat' as const, icon: <ArrowLeftRight className="w-6 h-6" />, title: 'This or That', desc: 'Vote on fun choices and see where you stand!', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
    { id: 'trivia' as const, icon: <Zap className="w-6 h-6" />, title: 'Fast Finger Trivia', desc: '5 seconds per question. How fast are you?', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { id: 'leaderboard' as const, icon: <Trophy className="w-6 h-6" />, title: 'Leaderboard', desc: 'See who\'s on top!', color: 'from-primary-500 to-primary-700', bg: 'bg-primary-50' },
  ];

  return (
    <div className="px-4 space-y-3">
      <div className="text-center py-4">
        <h2 className="text-2xl font-extrabold text-gray-800">🎮 Games</h2>
        <p className="text-gray-500 text-sm mt-1">Pick a game and challenge your crew!</p>
      </div>
      {games.map((g, i) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`w-full ${g.bg} rounded-2xl p-4 flex items-center gap-4 border border-white/50 hover:shadow-md transition-all active:scale-[0.98] animate-slide-up`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-white shadow-lg`}>
            {g.icon}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-gray-800">{g.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      ))}
    </div>
  );
}

function GuessWhoGame({ members, currentUser, quotes, onGuess, onReveal, onAddQuote, onBack }: {
  members: Member[];
  currentUser: Member;
  quotes: GuessQuote[];
  onGuess: (quoteId: string, guessedPersonId: string) => void;
  onReveal: (quoteId: string) => void;
  onAddQuote: (quote: GuessQuote) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'play' | 'submit'>('play');
  const [newQuote, setNewQuote] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const handleReveal = (qId: string) => {
    setRevealedId(qId);
    onReveal(qId);
    setTimeout(() => setRevealedId(null), 3000);
  };

  const handleSubmitQuote = () => {
    if (!newQuote.trim() || !selectedPerson) return;
    onAddQuote({
      id: generateId(),
      quote: newQuote.trim(),
      actualPersonId: selectedPerson,
      submittedBy: currentUser.id,
      guesses: [],
      revealed: false,
    });
    setNewQuote('');
    setSelectedPerson('');
    setTab('play');
  };

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-extrabold text-gray-800">🤔 Guess Who Said That</h2>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('play')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'play' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Play</button>
        <button onClick={() => setTab('submit')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'submit' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Submit Quote</button>
      </div>

      {tab === 'play' ? (
        <div className="space-y-3">
          {quotes.filter(q => q.submittedBy !== currentUser.id).map(q => {
            const alreadyGuessed = q.guesses.some(g => g.memberId === currentUser.id);
            const actualPerson = members.find(m => m.id === q.actualPersonId);
            const isRevealing = revealedId === q.id;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${isRevealing ? 'animate-bounce-in' : 'animate-slide-up'}`}>
                <p className="text-gray-800 font-medium italic">"{q.quote}"</p>
                {q.revealed ? (
                  <div className={`mt-3 flex items-center gap-2 ${isRevealing ? 'animate-scale-in' : ''}`}>
                    <span className="text-2xl">{actualPerson?.avatar}</span>
                    <span className="font-bold text-primary-600">It was {actualPerson?.name}!</span>
                    <span className="text-xl">🎉</span>
                  </div>
                ) : alreadyGuessed ? (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> You've guessed! Waiting for reveal...</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Who said this?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {members.filter(m => m.id !== currentUser.id).map(m => (
                        <button
                          key={m.id}
                          onClick={() => { onGuess(q.id, m.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-300 transition-all active:scale-90"
                        >
                          <span>{m.avatar}</span> {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!q.revealed && q.guesses.length > 0 && q.submittedBy === currentUser.id && (
                  <button
                    onClick={() => handleReveal(q.id)}
                    className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    🎭 Reveal Answer!
                  </button>
                )}
                <div className="mt-2 text-[10px] text-gray-400">{q.guesses.length} guess(es)</div>
              </div>
            );
          })}
          {quotes.filter(q => q.submittedBy !== currentUser.id).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🤷</p>
              <p className="text-sm">No quotes to guess yet! Submit one to get started.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4 animate-slide-up">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">The funny quote</label>
            <textarea
              value={newQuote}
              onChange={e => setNewQuote(e.target.value)}
              placeholder="Something someone actually said..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-400 outline-none text-sm resize-none"
              rows={2}
              maxLength={150}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Who actually said it?</label>
            <div className="flex flex-wrap gap-1.5">
              {members.filter(m => m.id !== currentUser.id).map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPerson(m.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedPerson === m.id ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400' : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
                >
                  {m.avatar} {m.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmitQuote}
            disabled={!newQuote.trim() || !selectedPerson}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm transition-all disabled:opacity-40 active:scale-95"
          >
            Submit Quote 🎤
          </button>
        </div>
      )}
    </div>
  );
}

function ThisOrThatGame({ polls, currentUser, onVote, onAdd, onBack }: {
  polls: Poll[];
  currentUser: Member;
  onVote: (pollId: string, optionIndex: number) => void;
  onAdd: (poll: Poll) => void;
  onBack: () => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');

  const handleAdd = () => {
    if (!optA.trim() || !optB.trim()) return;
    onAdd({
      id: generateId(),
      question: `${optA.trim()} or ${optB.trim()}?`,
      options: [{ text: optA.trim(), votes: [] }, { text: optB.trim(), votes: [] }],
      createdAt: Date.now(),
      closed: false,
      type: 'thisorthat',
    });
    setOptA('');
    setOptB('');
    setShowNew(false);
  };

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-extrabold text-gray-800">⚡ This or That</h2>
      </div>

      <button
        onClick={() => setShowNew(!showNew)}
        className="w-full py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-all"
      >
        {showNew ? 'Cancel' : '+ Create New Poll'}
      </button>

      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3 animate-slide-up">
          <input value={optA} onChange={e => setOptA(e.target.value)} placeholder="Option A (e.g. Beach trip)" className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm" maxLength={40} />
          <div className="text-center text-gray-400 text-xs font-bold">OR</div>
          <input value={optB} onChange={e => setOptB(e.target.value)} placeholder="Option B (e.g. Movie marathon)" className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm" maxLength={40} />
          <button onClick={handleAdd} disabled={!optA.trim() || !optB.trim()} className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-40">Create! 🎯</button>
        </div>
      )}

      {polls.map((poll, i) => {
        const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
        const hasVoted = poll.options.some(o => o.votes.includes(currentUser.id));
        return (
          <div key={poll.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <h3 className="font-bold text-gray-800 text-sm mb-3">{poll.question}</h3>
            <div className="space-y-2">
              {poll.options.map((opt, oi) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                const isVoted = opt.votes.includes(currentUser.id);
                return (
                  <button
                    key={oi}
                    onClick={() => !hasVoted && onVote(poll.id, oi)}
                    disabled={hasVoted}
                    className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all active:scale-[0.98] ${
                      isVoted ? 'ring-2 ring-primary-400' : hasVoted ? '' : 'hover:bg-gray-50'
                    } border ${isVoted ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}
                  >
                    {hasVoted && (
                      <div
                        className={`absolute inset-0 ${isVoted ? 'bg-primary-100/50' : 'bg-gray-100/50'} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{opt.text}</span>
                      {hasVoted && (
                        <span className={`text-sm font-extrabold ${isVoted ? 'text-primary-600' : 'text-gray-500'}`}>{pct}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
          </div>
        );
      })}
    </div>
  );
}

function TriviaGame({ currentUser, onScore, onBack }: {
  currentUser: Member;
  onScore: (score: number) => void;
  onBack: () => void;
}) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'result'>('ready');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setTimeLeft(5);
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || selectedAnswer !== null) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSelectedAnswer(-1); // timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, questionIndex, selectedAnswer]);

  useEffect(() => {
    if (selectedAnswer === null) return;
    const timer = setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(qi => qi + 1);
        setSelectedAnswer(null);
        setTimeLeft(5);
      } else {
        setGameState('result');
        onScore(score);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [selectedAnswer, questionIndex, questions.length, score, onScore]);

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(idx);
    if (idx === questions[questionIndex]?.correctIndex) {
      setScore(s => s + 10 + timeLeft * 2);
    }
  };

  if (gameState === 'ready') {
    return (
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-90">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-extrabold text-gray-800">⚡ Fast Finger Trivia</h2>
        </div>
        <div className="text-center py-8 space-y-4 animate-slide-up">
          <div className="inline-flex w-24 h-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <Zap className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-800">Ready?</h3>
          <p className="text-gray-500 text-sm">5 questions • 5 seconds each<br />Mix of Bible & group trivia!</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" /> Faster answers = more points
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Start! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-90">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-extrabold text-gray-800">Results!</h2>
        </div>
        <div className="text-center py-8 space-y-4 animate-bounce-in">
          <div className="text-6xl">
            {score >= 40 ? '🏆' : score >= 25 ? '⭐' : '💪'}
          </div>
          <h3 className="text-3xl font-extrabold text-gray-800">{score} pts</h3>
          <p className="text-gray-500">{currentUser.name}, {score >= 40 ? 'you\'re a legend!' : score >= 25 ? 'nice job!' : 'keep practicing!'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={startGame} className="px-6 py-2 rounded-xl bg-primary-500 text-white font-bold text-sm active:scale-95">Play Again</button>
            <button onClick={onBack} className="px-6 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95">Back</button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[questionIndex];
  if (!q) return null;

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400">{questionIndex + 1}/{questions.length}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary-600">Score: {score}</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${timeLeft <= 2 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <Clock className="w-3.5 h-3.5" /> {timeLeft}s
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timeLeft <= 2 ? 'bg-red-500' : 'bg-amber-400'}`}
          style={{ width: `${(timeLeft / 5) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-scale-in">
        <h3 className="text-lg font-bold text-gray-800 text-center mb-4">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const isCorrect = oi === q.correctIndex;
            const isSelected = selectedAnswer === oi;
            const showResult = selectedAnswer !== null;
            return (
              <button
                key={oi}
                onClick={() => handleAnswer(oi)}
                disabled={selectedAnswer !== null}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] border-2 ${
                  showResult
                    ? isCorrect
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : isSelected
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {showResult && isCorrect && <Check className="w-4 h-4 text-green-600" />}
                  {showResult && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>
        {selectedAnswer === -1 && (
          <p className="text-center text-red-500 text-sm font-bold mt-3 animate-scale-in">⏰ Time's up!</p>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ members, triviaScores, onBack }: {
  members: Member[];
  triviaScores: Record<string, number>;
  onBack: () => void;
}) {
  const sorted = [...members].sort((a, b) => (triviaScores[b.id] || 0) - (triviaScores[a.id] || 0));
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-extrabold text-gray-800">🏆 Leaderboard</h2>
      </div>

      {/* Top 3 */}
      <div className="flex items-end justify-center gap-2 py-4">
        {[1, 0, 2].map(pos => {
          const m = sorted[pos];
          if (!m) return null;
          return (
            <div key={m.id} className={`flex flex-col items-center ${pos === 0 ? 'mb-4' : ''} animate-slide-up`} style={{ animationDelay: `${pos * 100}ms` }}>
              <span className="text-2xl mb-1">{medals[pos]}</span>
              <div className={`${pos === 0 ? 'w-16 h-16' : 'w-12 h-12'} rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-2xl shadow-sm`}>
                {m.avatar}
              </div>
              <span className="font-bold text-gray-800 text-xs mt-1">{m.name}</span>
              <span className="text-[10px] text-primary-600 font-bold">{triviaScores[m.id] || 0} pts</span>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sorted.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i !== sorted.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <span className="w-6 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
            <span className="text-lg">{m.avatar}</span>
            <div className="flex-1">
              <span className="font-semibold text-gray-800 text-sm">{m.name}</span>
              <div className="flex gap-1 mt-0.5">
                {m.badges.slice(0, 3).map(b => (
                  <span key={b} className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full">{b}</span>
                ))}
              </div>
            </div>
            <span className="font-bold text-primary-600 text-sm">{triviaScores[m.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
