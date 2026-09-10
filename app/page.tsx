'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Level = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';
type DifficultyOption = 1 | 2 | 3 | 4;
type GameStatus = 'Win' | 'Loss';

interface SubmissionResult {
  id: number;
  username: string;
  level: Level;
  difficulty: DifficultyOption;
  clicks: number;
  time_taken: number;
  checkpoints: number;
  status: GameStatus;
  score: number;
  created_at?: string;
}

export default function VolunteerScorePage() {
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState<Level>('Level 1');
  const [difficulty, setDifficulty] = useState<DifficultyOption>(1);
  const [timeTaken, setTimeTaken] = useState('');
  const [clicks, setClicks] = useState('');
  const [checkpoints, setCheckpoints] = useState('');
  const [status, setStatus] = useState<GameStatus>('Win');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SubmissionResult | null>(null);
  const [recentEntries, setRecentEntries] = useState<SubmissionResult[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Focus username on initial load
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  // Client-side validation only; does NOT call fetch.
  // If valid, shows the confirmation panel.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client validation for responsive feedback
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMessage('ERR_EMPTY_USER: Player username is required.');
      usernameInputRef.current?.focus();
      return;
    }

    const timeNum = Number(timeTaken);
    if (isNaN(timeNum) || timeNum < 0) {
      setErrorMessage('ERR_INVALID_TIME: Time taken must be a valid non-negative number.');
      return;
    }

    const clicksNum = Number(clicks);
    if (!Number.isInteger(clicksNum) || clicksNum < 0) {
      setErrorMessage('ERR_INVALID_CLICKS: Clicks must be a non-negative integer.');
      return;
    }

    const checkpointsNum = Number(checkpoints);
    if (!Number.isInteger(checkpointsNum) || checkpointsNum < 0) {
      setErrorMessage('ERR_INVALID_CHECKPOINTS: Checkpoints must be a non-negative integer.');
      return;
    }

    // Validation passed — show confirmation screen.
    // No API request is made here.
    setShowConfirmation(true);
  };

  // Called ONLY when the volunteer clicks CONFIRM in the review panel.
  // This is the single place that calls POST /api/scores.
  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          level,
          difficulty,
          time_taken: Number(timeTaken),
          clicks: Number(clicks),
          checkpoints: Number(checkpoints),
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'ERR_SUBMISSION_FAILED: Server rejected submission.');
        // Values preserved on error — volunteer can retry or cancel
        return;
      }

      // Success
      const result: SubmissionResult = data.result;
      setSuccessResult(result);
      setRecentEntries((prev) => [result, ...prev].slice(0, 5));
      setShowConfirmation(false);

      // Reset form fields for rapid consecutive entry
      setUsername('');
      setTimeTaken('');
      setClicks('');
      setCheckpoints('');
      setErrorMessage(null);

      // Immediately refocus the username field
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      setErrorMessage('ERR_NETWORK: Failed to connect to /api/scores endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  // Called when CANCEL is clicked. No API request. All form values preserved.
  const handleCancel = () => {
    setShowConfirmation(false);
    setErrorMessage(null);
  };

  // Preview score for the confirmation screen (display only — NOT authoritative).
  const previewBase =
    Math.max(100, 10000 - 10 * Number(timeTaken) - 100 * Number(clicks)) +
    Number(checkpoints) * 250;
  const previewScore = Math.round(difficulty * previewBase);

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 font-mono py-8 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Terminal Header */}
        <header className="border border-slate-800 bg-[#0b101e] p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider text-cyan-400">wikiLYNX // BACKUP</span>
              <span className="text-[10px] px-2 py-0.5 uppercase tracking-widest bg-cyan-950 border border-cyan-700/50 text-cyan-300 font-bold">
                VOLUNTEER_OPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Terminal: Score Intake System • Server-Auth Scoring Active
            </p>
          </div>
          <div>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition uppercase tracking-wider"
            >
              <span>[ LEADERBOARD ] →</span>
            </Link>
          </div>
        </header>

        {/* Success Banner */}
        {successResult && (
          <div
            role="status"
            className="border-2 border-emerald-500 bg-[#061812] p-4 text-emerald-300 shadow-lg shadow-emerald-950/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  <span>[STATUS: SUCCESS_RECORDED]</span>
                </div>
                <div className="text-sm mt-1 text-white">
                  PLAYER: <span className="font-bold text-cyan-300">@{successResult.username}</span> | {successResult.level} | D{successResult.difficulty} | {successResult.status}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">SERVER SCORE</span>
                <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
                  {successResult.score.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-emerald-800/60 grid grid-cols-3 gap-2 text-center text-[11px] text-emerald-200/90">
              <div>TIME: <span className="text-white font-bold">{successResult.time_taken}s</span></div>
              <div>CLICKS: <span className="text-white font-bold">{successResult.clicks}</span></div>
              <div>CHECKPOINTS: <span className="text-white font-bold">{successResult.checkpoints}</span></div>
            </div>
            <div className="mt-2 text-[10px] text-emerald-400/80 uppercase tracking-widest text-center">
              &gt;&gt; READY FOR NEXT INTAKE ENTRY &lt;&lt;
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="border-2 border-rose-500 bg-[#1e0a0d] p-4 text-rose-300 shadow-lg shadow-rose-950/50"
          >
            <div className="text-xs uppercase tracking-widest font-bold text-rose-400">
              [CRITICAL ERROR]
            </div>
            <p className="text-sm mt-1 text-rose-200">{errorMessage}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONFIRMATION / REVIEW PANEL (shown after form validation)    */}
        {/* ============================================================ */}
        {showConfirmation ? (
          <section className="border border-slate-800 bg-[#0b101e] p-6 sm:p-7 shadow-xl">
            {/* Confirmation Header */}
            <div className="border-b border-slate-800 pb-3 mb-5">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                // SCORE_ENTRY :: REVIEW_BEFORE_COMMIT
              </span>
            </div>

            {/* Review Data Grid */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">PLAYER</span>
                <span className="text-white font-bold">@{username.trim()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">LEVEL</span>
                <span className="text-white font-bold">{level}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">DIFFICULTY</span>
                <span className="text-white font-bold">D{difficulty}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">TIME</span>
                <span className="text-white font-bold">{timeTaken}s</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">CLICKS</span>
                <span className="text-white font-bold">{clicks}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">CHECKPOINTS</span>
                <span className="text-white font-bold">{checkpoints}</span>
              </div>
              <div className="flex justify-between pb-1.5">
                <span className="text-slate-400 uppercase text-xs tracking-wider">STATUS</span>
                <span className={`font-bold uppercase ${status === 'Win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Score Preview */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                SCORE PREVIEW (SERVER WILL RECALCULATE)
              </div>
              <div className="text-3xl font-extrabold text-cyan-300 tracking-tight mt-1">
                {previewScore.toLocaleString()} <span className="text-base font-bold text-cyan-500">PTS</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 text-sm font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                [ CANCEL — EDIT FORM ]
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 text-sm font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 border border-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40 transition active:translate-y-px"
              >
                {isLoading ? '[ COMMITTING TO SERVER... ]' : '[ CONFIRM — COMMIT SCORE ]'}
              </button>
            </div>
          </section>
        ) : (
          /* ============================================================ */
          /* VOLUNTEER ENTRY FORM (existing — unchanged)                  */
          /* ============================================================ */
          <section className="border border-slate-800 bg-[#0b101e] p-6 sm:p-7 shadow-xl">
            <div className="border-b border-slate-800 pb-3 mb-5 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                // DATA_INTAKE_FORM
              </span>
              <span className="text-[10px] text-slate-500 uppercase">
                FIELDS: 7 | AUTO_CALCULATED: SCORE
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Player Username */}
              <div>
                <label htmlFor="username" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                  1. Player Username <span className="text-rose-400">*</span>
                </label>
                <input
                  id="username"
                  ref={usernameInputRef}
                  type="text"
                  required
                  placeholder="e.g. runner_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 2: Level */}
                <div>
                  <label htmlFor="level" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    2. Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Level)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                  </select>
                </div>

                {/* Field 3: Difficulty */}
                <div>
                  <label htmlFor="difficulty" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    3. Difficulty <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyOption)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value={1}>Difficulty 1</option>
                    <option value={2}>Difficulty 2</option>
                    <option value={3}>Difficulty 3</option>
                    <option value={4}>Difficulty 4</option>
                  </select>
                </div>

                {/* Field 4: Time Taken */}
                <div>
                  <label htmlFor="time_taken" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    4. Time Taken (sec) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="time_taken"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 19.4"
                    value={timeTaken}
                    onChange={(e) => setTimeTaken(e.target.value)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

                {/* Field 5: Clicks */}
                <div>
                  <label htmlFor="clicks" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    5. Clicks <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="clicks"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 43"
                    value={clicks}
                    onChange={(e) => setClicks(e.target.value)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

                {/* Field 6: Checkpoints */}
                <div>
                  <label htmlFor="checkpoints" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    6. Checkpoints <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="checkpoints"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 2"
                    value={checkpoints}
                    onChange={(e) => setCheckpoints(e.target.value)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

                {/* Field 7: Status */}
                <div>
                  <label htmlFor="status" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    7. Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GameStatus)}
                    disabled={isLoading}
                    className="mt-1.5 block w-full bg-[#050811] border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value="Win">Win</option>
                    <option value="Loss">Loss</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-sm font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 border border-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40 transition active:translate-y-px"
                >
                  [ REVIEW SCORE INTAKE (ENTER) ]
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Recent Session Submissions Log */}
        {recentEntries.length > 0 && (
          <section className="border border-slate-800 bg-[#0b101e]/60 p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
              // RECENT_SESSION_LOG (LAST 5)
            </div>
            <div className="divide-y divide-slate-800/80 text-xs">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">@{entry.username}</span>
                    <span className="text-slate-400 ml-2">[{entry.level} • D{entry.difficulty}]</span>
                    <span className="text-slate-500 ml-2">
                      {entry.time_taken}s • {entry.clicks}c • {entry.checkpoints}cp • {entry.status}
                    </span>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    {entry.score.toLocaleString()} PTS
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
