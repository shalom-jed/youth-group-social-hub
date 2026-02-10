import { Challenge, Member, BADGE_ICONS } from '../store';
import { Award, CheckCircle, Flame, Star } from 'lucide-react';

interface Props {
  challenges: Challenge[];
  members: Member[];
  currentUser: Member;
  onComplete: (challengeId: string) => void;
}

export default function Challenges({ challenges, members, currentUser, onComplete }: Props) {
  const totalXp = currentUser.xp;
  const level = Math.floor(totalXp / 50) + 1;
  const xpInLevel = totalXp % 50;

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* XP Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-primary-200 text-xs font-medium">Your Level</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold">{level}</span>
              <Flame className="w-6 h-6 text-accent-400" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary-200 text-xs font-medium">Total XP</p>
            <p className="text-2xl font-extrabold">{totalXp}</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-400 to-warm-400 transition-all duration-700"
            style={{ width: `${(xpInLevel / 50) * 100}%` }}
          />
        </div>
        <p className="text-primary-200 text-[10px] mt-1">{xpInLevel}/50 XP to next level</p>
      </div>

      {/* Badges */}
      {currentUser.badges.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1">
            <Award className="w-4 h-4 text-primary-500" /> Your Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.badges.map(badge => (
              <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100">
                <span className="text-sm">{BADGE_ICONS[badge] || '🏅'}</span>
                <span className="text-xs font-semibold text-primary-700">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Challenges */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
          Weekly Challenges
        </h3>
        <div className="space-y-3">
          {challenges.map((ch, i) => {
            const isCompleted = ch.completedBy.includes(currentUser.id);
            const completedMembers = members.filter(m => ch.completedBy.includes(m.id));
            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border ${isCompleted ? 'border-green-200 bg-green-50/50' : 'border-gray-100'} p-4 shadow-sm animate-slide-up`}
                style={{ animationDelay: `${(i + 2) * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-primary-100'}`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="text-lg">{BADGE_ICONS[ch.badgeReward || ''] || '🎯'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm">{ch.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">+{ch.xpReward} XP</span>
                      {ch.badgeReward && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {BADGE_ICONS[ch.badgeReward]} {ch.badgeReward}
                        </span>
                      )}
                    </div>
                    {completedMembers.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-gray-400">Completed by:</span>
                        <div className="flex -space-x-1">
                          {completedMembers.slice(0, 5).map(m => (
                            <span key={m.id} className="text-xs" title={m.name}>{m.avatar}</span>
                          ))}
                        </div>
                        {completedMembers.length > 5 && (
                          <span className="text-[10px] text-gray-400">+{completedMembers.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => onComplete(ch.id)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-90"
                    >
                      Done! ✅
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
