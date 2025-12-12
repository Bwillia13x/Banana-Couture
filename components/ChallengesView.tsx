import React, { useState, useEffect } from 'react';
import { Challenge, UserStats } from '../types';
import { LazyImage } from './LazyImage';

interface ChallengesViewProps {
  challenges: Challenge[];
  onEnterChallenge: (challenge: Challenge) => void;
  userStats: UserStats;
}

const LEADERBOARD_DATA = [
    { rank: 1, name: 'Kaito_Design', level: 45, xp: 125400, avatar: 'Kaito', badges: ['🏆', '🔥', '⚡️'], trend: 'up' },
    { rank: 2, name: 'Studio_V', level: 42, xp: 118200, avatar: 'V', badges: ['🏆', '🎨'], trend: 'same' },
    { rank: 3, name: 'TechWear_Global', level: 38, xp: 98500, avatar: 'Tech', badges: ['🔥'], trend: 'down' },
    { rank: 4, name: 'Aura_Moda', level: 35, xp: 86400, avatar: 'Aura', badges: ['⚡️', '🚀'], trend: 'up' },
    { rank: 5, name: 'Neon_Stitch', level: 31, xp: 72100, avatar: 'Neon', badges: ['🎨'], trend: 'same' },
];

const Countdown: React.FC<{ timeLeftStr: string }> = ({ timeLeftStr }) => {
    const parseTime = (str: string) => {
        const hMatch = str.match(/(\d+)h/);
        const mMatch = str.match(/(\d+)m/);
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        return (h * 60 * 60 * 1000) + (m * 60 * 1000);
    };

    const [msLeft, setMsLeft] = useState(() => parseTime(timeLeftStr));

    useEffect(() => {
        const interval = setInterval(() => {
            setMsLeft(prev => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const h = Math.floor(msLeft / (1000 * 60 * 60));
    const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((msLeft % (1000 * 60)) / 1000);

    const isUrgent = h < 2;

    return (
        <span className={`font-mono tabular-nums ${isUrgent ? 'text-nc-rose animate-pulse' : 'text-nc-ink'}`}>
            {h}h {m}m {s}s
        </span>
    );
};

export const ChallengesView: React.FC<ChallengesViewProps> = ({ challenges, onEnterChallenge, userStats }) => {
  const [activeTab, setActiveTab] = useState<'briefs' | 'leaderboard'>('briefs');

  return (
    <div className="min-h-full pb-32 bg-nc-bg">
      {/* Hero Header */}
      <div className="relative py-16 px-6 overflow-hidden bg-nc-bg-elevated border-b border-nc-border-subtle">
         <div className="absolute inset-0 opacity-30 pointer-events-none nc-hero-gradient"></div>

         <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-4 animate-fade-in-up opacity-0 stagger-1">
                <span className="inline-block py-1.5 px-4 rounded-full bg-red-50 border border-red-100 text-nc-rose text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
                  Live Competitions
                </span>
                <span className="w-2 h-2 bg-nc-rose rounded-full animate-glow-pulse shadow-lg shadow-rose-500/50"></span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-nc-ink mb-6 tracking-tight leading-none animate-fade-in-up opacity-0 stagger-2">
              <span className="font-display italic font-normal">Daily</span> <span className="gradient-text">Design Briefs</span>
            </h2>
            <p className="text-nc-ink-soft text-lg max-w-2xl leading-relaxed mb-8 animate-fade-in-up opacity-0 stagger-3">
              Test your skills, earn XP, and get featured on the global leaderboard.
            </p>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-nc-bg-soft p-1 rounded-nc-lg inline-flex shadow-inner animate-fade-in-up opacity-0 stagger-4">
                <button 
                    onClick={() => setActiveTab('briefs')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-ring ${activeTab === 'briefs' ? 'bg-white text-nc-rose shadow-md' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                >
                    Active Briefs
                </button>
                <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-ring ${activeTab === 'leaderboard' ? 'bg-white text-violet-600 shadow-md' : 'text-nc-ink-soft hover:text-nc-ink'}`}
                >
                    Leaderboard
                </button>
            </div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {activeTab === 'briefs' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                {challenges.map((challenge) => (
                <div key={challenge.id} className="group relative bg-nc-bg-elevated rounded-nc-xl border border-nc-border-subtle overflow-hidden hover:border-nc-rose transition-all shadow-nc-soft hover:shadow-nc-card card-lift">
                    <div className="h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <LazyImage 
                        src={challenge.coverImage} 
                        alt={challenge.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        containerClassName="w-full h-full"
                    />
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                        <div className="glass px-3 py-1.5 rounded-full text-[10px] font-bold text-nc-ink uppercase flex items-center gap-2 shadow-sm">
                            <svg className="w-3 h-3 text-nc-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <Countdown timeLeftStr={challenge.timeLeft} />
                        </div>
                        <div className="glass px-3 py-1.5 rounded-full text-[10px] font-bold text-nc-ink uppercase shadow-sm">
                            {challenge.participants} Entries
                        </div>
                    </div>
                    </div>

                    <div className="p-6 relative z-20 bg-nc-bg-elevated">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-nc-ink group-hover:text-nc-rose transition-colors font-display">{challenge.title}</h3>
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                            challenge.difficulty === 'Easy' ? 'bg-emerald-50 text-nc-emerald border-emerald-200' :
                            challenge.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-red-50 text-nc-rose border-red-200'
                        }`}>
                            {challenge.difficulty}
                        </div>
                    </div>
                    
                    <p className="text-nc-ink-soft text-sm mb-6 leading-relaxed line-clamp-2">
                        {challenge.description}
                    </p>

                    <div className="space-y-3 mb-8">
                        <p className="text-[10px] text-nc-ink-subtle uppercase font-bold tracking-[0.15em]">Requirements</p>
                        {challenge.requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-nc-ink">
                                <div className="w-1.5 h-1.5 rounded-full bg-nc-rose"></div>
                                {req}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-nc-border-subtle">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-nc-ink-subtle uppercase">Reward</span>
                            <span className="text-lg font-bold text-nc-gold flex items-center gap-1">
                                +{challenge.xpReward} <span className="text-[10px] text-nc-gold/70">XP</span>
                            </span>
                        </div>
                        <button 
                            onClick={() => onEnterChallenge(challenge)}
                            className="bg-gradient-to-r from-nc-rose to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-200 flex items-center gap-2 btn-primary"
                        >
                            Enter Challenge
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        ) : (
            <div className="max-w-4xl mx-auto bg-nc-bg-elevated border border-nc-border-subtle rounded-nc-xl overflow-hidden animate-fade-in shadow-nc-card">
                <div className="p-6 border-b border-nc-border-subtle bg-nc-bg-soft/30 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-nc-ink font-display">Global Top 100</h3>
                    <div className="text-xs text-nc-ink-subtle">Updated 5m ago</div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-nc-border-subtle text-[10px] font-bold uppercase tracking-[0.15em] text-nc-ink-subtle bg-nc-bg-soft/30">
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Designer</th>
                                <th className="px-6 py-4 text-center">Trend</th>
                                <th className="px-6 py-4 text-center">Level</th>
                                <th className="px-6 py-4 text-right">Total XP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-nc-border-subtle">
                            {LEADERBOARD_DATA.map((user) => (
                                <tr key={user.rank} className="group hover:bg-nc-bg-soft transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm shadow-sm ${
                                            user.rank === 1 ? 'bg-nc-gold text-white shadow-amber-400/30' :
                                            user.rank === 2 ? 'bg-gray-300 text-white' :
                                            user.rank === 3 ? 'bg-amber-700 text-white' :
                                            'text-nc-ink-subtle bg-nc-bg-soft font-mono'
                                        }`}>
                                            {user.rank <= 3 ? user.rank : `#${user.rank}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} alt={user.name} className="w-8 h-8 rounded-full bg-nc-bg-soft border border-nc-border-subtle" />
                                            <div>
                                                <div className="font-bold text-nc-ink group-hover:text-nc-accent transition-colors">{user.name}</div>
                                                <div className="flex gap-1 mt-0.5 text-[10px]">
                                                    {user.badges.map((b, i) => <span key={i} className="grayscale group-hover:grayscale-0 transition-all">{b}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.trend === 'up' && <span className="text-nc-emerald font-bold text-xs">▲</span>}
                                        {user.trend === 'down' && <span className="text-nc-rose font-bold text-xs">▼</span>}
                                        {user.trend === 'same' && <span className="text-nc-ink-subtle font-bold text-xs">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-white border border-nc-border-subtle px-2.5 py-1 rounded-full text-xs font-bold text-nc-accent-strong">
                                            {user.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-nc-emerald text-sm font-bold">
                                        {user.xp.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {/* User's Actual Rank */}
                            <tr className="bg-nc-accent-soft/30 border-t-2 border-nc-accent-soft">
                                <td className="px-6 py-4">
                                    <div className="text-nc-accent-strong font-mono text-sm font-bold">#142</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="You" className="w-8 h-8 rounded-full bg-white border-2 border-nc-accent-soft" />
                                        <div>
                                            <div className="font-bold text-nc-ink">You</div>
                                            <div className="text-[10px] text-nc-accent font-bold">Keep climbing!</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center"><span className="text-nc-emerald font-bold text-xs">▲</span></td>
                                <td className="px-6 py-4 text-center">
                                     <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg shadow-violet-500/30">
                                        {userStats.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-nc-emerald text-sm font-bold">
                                    {userStats.xp.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};