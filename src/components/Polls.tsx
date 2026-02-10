import { useState } from 'react';
import { Poll, Member, generateId } from '../store';
import { BarChart3, Plus, X, Check } from 'lucide-react';

interface Props {
  polls: Poll[];
  currentUser: Member;
  onVote: (pollId: string, optionIndex: number) => void;
  onAddPoll: (poll: Poll) => void;
}

export default function Polls({ polls, currentUser, onVote, onAddPoll }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const decisionPolls = polls.filter(p => p.type === 'decision');

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleRemoveOption = (i: number) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleCreate = () => {
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) return;
    onAddPoll({
      id: generateId(),
      question: question.trim(),
      options: validOpts.map(o => ({ text: o.trim(), votes: [] })),
      createdAt: Date.now(),
      closed: false,
      type: 'decision',
    });
    setQuestion('');
    setOptions(['', '']);
    setShowCreate(false);
  };

  return (
    <div className="px-4 space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-extrabold text-gray-800">Polls & Voting</h2>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-sm hover:bg-primary-600 transition-all active:scale-90"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* Create Poll */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3 animate-slide-up">
          <h3 className="font-bold text-gray-800 text-sm">Create a Poll</h3>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="What's the question?"
            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-400 outline-none text-sm text-gray-800"
            maxLength={100}
          />
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={e => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary-400 outline-none text-sm"
                maxLength={50}
              />
              {options.length > 2 && (
                <button onClick={() => handleRemoveOption(i)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            {options.length < 6 && (
              <button onClick={handleAddOption} className="text-xs text-primary-600 font-semibold hover:text-primary-700">+ Add option</button>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-95"
          >
            Create Poll 📊
          </button>
        </div>
      )}

      {/* Polls List */}
      {decisionPolls.length === 0 && !showCreate && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-sm">No polls yet. Create one!</p>
        </div>
      )}

      {decisionPolls.sort((a, b) => b.createdAt - a.createdAt).map((poll, i) => {
        const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
        const hasVoted = poll.options.some(o => o.votes.includes(currentUser.id));
        const maxVotes = Math.max(...poll.options.map(o => o.votes.length));

        return (
          <div key={poll.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <h3 className="font-bold text-gray-800 mb-3">{poll.question}</h3>
            <div className="space-y-2">
              {poll.options.map((opt, oi) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                const isVoted = opt.votes.includes(currentUser.id);
                const isLeading = opt.votes.length === maxVotes && maxVotes > 0;
                return (
                  <button
                    key={oi}
                    onClick={() => !hasVoted && onVote(poll.id, oi)}
                    disabled={hasVoted}
                    className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all active:scale-[0.98] border-2 ${
                      isVoted
                        ? 'border-primary-400 bg-primary-50'
                        : isLeading && hasVoted
                          ? 'border-accent-300 bg-accent-400/5'
                          : hasVoted
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {hasVoted && (
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-700 rounded-l-xl ${
                          isVoted ? 'bg-primary-100/60' : isLeading ? 'bg-accent-400/10' : 'bg-gray-100/60'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isVoted && <Check className="w-3.5 h-3.5 text-primary-600" />}
                        <span className="text-sm font-medium text-gray-700">{opt.text}</span>
                      </div>
                      {hasVoted && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{opt.votes.length} vote{opt.votes.length !== 1 ? 's' : ''}</span>
                          <span className={`text-sm font-extrabold ${isVoted ? 'text-primary-600' : isLeading ? 'text-accent-500' : 'text-gray-400'}`}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-gray-400">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
              {hasVoted && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Voted</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
