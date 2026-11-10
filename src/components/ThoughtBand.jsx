import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';

// Short thoughts about auctions and second-hand finds.
export const AUCTION_THOUGHTS = [
  'Every great find has a story. Make it your next chapter.',
  'An auction is simple: the right item finds the person who values it most.',
  'Great gear should never gather dust. Give it a second life.',
  'Patience, timing and a good eye. That is the art of an auction.',
  "One student's finished chapter is another's fresh start.",
  'The best finds reward those who show up on time.',
];

export default function ThoughtBand({ intervalMs = 7000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % AUCTION_THOUGHTS.length), intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs]);

  return (
    <section
      className="relative rounded-3xl border border-slate-200 bg-white px-6 py-8 sm:px-12 sm:py-10 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="A thought on auctions"
    >
      <Quote className="absolute -top-2 left-4 w-24 h-24 text-emerald-500/10 rotate-180 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">
          A thought on auctions
        </p>
        <p
          key={index}
          className="rl-fade-up text-xl sm:text-2xl font-semibold text-slate-900 leading-snug min-h-[3.5rem] sm:min-h-[4.5rem] flex items-center justify-center"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          &ldquo;{AUCTION_THOUGHTS[index]}&rdquo;
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {AUCTION_THOUGHTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show thought ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
