'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface LeaderboardEntry {
  id: number;
  username: string;
  level: string;
  difficulty: number;
  score: number;
  time_taken: number;
  clicks: number;
  checkpoints: number;
  status: string;
}

type ViewFilter = 'Mixed' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<ViewFilter>('Mixed');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Retrieve only the required columns, sorted by score DESC
      let query = supabase
        .from('scores')
        .select('id, username, level, difficulty, score, time_taken, clicks, checkpoints, status')
        .order('score', { ascending: false });

      if (selectedView !== 'Mixed') {
        query = query.eq('level', selectedView);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        throw dbError;
      }

      setEntries(data || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Leaderboard read error:', err?.message || err);
      setError('ERR_DATA_FETCH: Unable to read leaderboard scores from database.');
    } finally {
      setLoading(false);
    }
  }, [selectedView]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/50 text-xs">
          #01 🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="px-2 py-0.5 bg-slate-300/20 text-slate-200 font-bold border border-slate-400/40 text-xs">
          #02 🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="px-2 py-0.5 bg-amber-700/20 text-amber-500 font-bold border border-amber-700/40 text-xs">
          #03 🥉
        </span>
      );
    }
    return (
      <span className="text-slate-400 font-mono text-xs font-semibold">
        #{rank < 10 ? `0${rank}` : rank}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 font-mono py-8 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Terminal Header */}
        <header className="border border-slate-800 bg-[#0b101e] p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-wider text-cyan-400">wikiLYNX // BACKUP</span>
              <span className="text-[10px] px-2 py-0.5 uppercase tracking-widest bg-cyan-950 border border-cyan-700/50 text-cyan-300 font-bold">
                LEADERBOARD_SYSTEM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Public Real-Time Rankings • Ranked by Score (DESC)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLeaderboard()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition uppercase tracking-wider disabled:opacity-50"
            >
              <span>[ REFRESH ]</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400 transition uppercase tracking-wider"
            >
              <span>[ VOLUNTEER INTAKE ] →</span>
            </Link>
          </div>
        </header>

        {/* View Filter Controls Bar */}
        <div className="border border-slate-800 bg-[#0b101e] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="view-select" className="text-xs uppercase tracking-wider text-slate-300 font-semibold shrink-0">
              LEADERBOARD VIEW:
            </label>
            <select
              id="view-select"
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as ViewFilter)}
              className="bg-[#050811] border border-slate-700 px-3 py-1.5 text-xs text-cyan-300 font-bold uppercase tracking-wider focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            >
              <option value="Mixed">Mixed (All Levels)</option>
              <option value="Level 1">Level 1</option>
              <option value="Level 2">Level 2</option>
              <option value="Level 3">Level 3</option>
              <option value="Level 4">Level 4</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            {lastRefreshed && (
              <span>SYNC: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • RECORDS: {entries.length}</span>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="border-2 border-rose-500 bg-[#1e0a0d] p-4 text-rose-300 flex items-center justify-between shadow-lg"
          >
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-rose-400">[DATA_ERROR]</div>
              <p className="text-sm mt-0.5 text-rose-200">{error}</p>
            </div>
            <button
              onClick={() => fetchLeaderboard()}
              className="px-3 py-1 text-xs font-bold uppercase bg-rose-900 border border-rose-600 text-white hover:bg-rose-800 transition"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="border border-slate-800 bg-[#0b101e] p-8 text-center space-y-3">
            <div className="text-cyan-400 text-sm tracking-widest animate-pulse font-bold">
              [ SCANNING & RETRIEVING LIVE DATABASE RECORDS... ]
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="border border-slate-800 bg-[#0b101e] p-12 text-center space-y-3">
            <div className="text-slate-400 text-sm tracking-widest font-bold uppercase">
              // NO_RECORDS_FOUND
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {selectedView === 'Mixed'
                ? 'No scores have been submitted yet. Volunteer intakes will populate here in real-time.'
                : `No recorded scores for ${selectedView} yet.`}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-500"
              >
                Submit Score →
              </Link>
            </div>
          </div>
        )}

        {/* Leaderboard Table (Desktop) & Cards (Mobile) */}
        {!loading && !error && entries.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block border border-slate-800 bg-[#0b101e] shadow-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#060a14] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th scope="col" className="py-3 px-4 w-16 text-center">RANK</th>
                    <th scope="col" className="py-3 px-4">PLAYER</th>
                    <th scope="col" className="py-3 px-4 text-right">SCORE</th>
                    <th scope="col" className="py-3 px-4 text-right">TIME</th>
                    <th scope="col" className="py-3 px-4 text-right">CLICKS</th>
                    <th scope="col" className="py-3 px-4 text-center">DIFFICULTY</th>
                    <th scope="col" className="py-3 px-4 text-right">CHECKPOINTS</th>
                    <th scope="col" className="py-3 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {entries.map((entry, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition hover:bg-slate-900/60 ${
                          rank === 1 ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getRankDisplay(rank)}
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          <span className="text-cyan-400">@{entry.username}</span>
                          <span className="text-[10px] text-slate-500 font-normal ml-2">[{entry.level}]</span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-extrabold text-sm text-emerald-400">
                            {Number(entry.score).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 whitespace-nowrap">
                          {entry.time_taken}s
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 whitespace-nowrap">
                          {entry.clicks}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 font-bold text-[11px]">
                            D{entry.difficulty ?? 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 whitespace-nowrap">
                          {entry.checkpoints}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 font-bold uppercase text-[10px] border ${
                              entry.status === 'Win'
                                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                                : 'bg-rose-950/60 border-rose-600/60 text-rose-300'
                            }`}
                          >
                            {entry.status ?? 'Win'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={entry.id}
                    className="border border-slate-800 bg-[#0b101e] p-4 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRankDisplay(rank)}
                        <div>
                          <div className="font-bold text-white text-sm">@{entry.username}</div>
                          <div className="text-[10px] text-slate-400">
                            {entry.level} • D{entry.difficulty ?? 1}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 block">SCORE</span>
                        <span className="font-extrabold text-base text-emerald-400">
                          {Number(entry.score).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="bg-[#050811] p-1.5 border border-slate-800">
                        <span className="text-slate-500 block">TIME</span>
                        <span className="font-bold text-white">{entry.time_taken}s</span>
                      </div>
                      <div className="bg-[#050811] p-1.5 border border-slate-800">
                        <span className="text-slate-500 block">CLICKS</span>
                        <span className="font-bold text-white">{entry.clicks}</span>
                      </div>
                      <div className="bg-[#050811] p-1.5 border border-slate-800">
                        <span className="text-slate-500 block">CHKPTS</span>
                        <span className="font-bold text-white">{entry.checkpoints}</span>
                      </div>
                      <div className="bg-[#050811] p-1.5 border border-slate-800">
                        <span className="text-slate-500 block">STATUS</span>
                        <span className={`font-bold ${entry.status === 'Win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.status ?? 'Win'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
