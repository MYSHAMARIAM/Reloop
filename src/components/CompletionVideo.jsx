import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, Truck, Handshake } from 'lucide-react';

/**
 * Plays the order-completion animation.
 *
 * Put your two videos in  public/videos/  with these names:
 *   delivery-complete.mp4   (or .webm)   -> shown when a DELIVERY order is completed
 *   handover-complete.mp4   (or .webm)   -> shown when a campus HANDOVER order is completed
 *
 * If a file is missing the modal shows a friendly animated "completed" card instead,
 * so nothing breaks while you are still adding the videos.
 */
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const FILES = {
  delivery: ['videos/delivery-complete.mp4', 'videos/delivery-complete.webm'],
  handover: ['videos/handover-complete.mp4', 'videos/handover-complete.webm'],
};
const COPY = {
  delivery: { title: 'Delivery complete!', sub: 'Your item has arrived. Enjoy it!', Icon: Truck },
  handover: { title: 'Handover complete!', sub: 'The item has changed hands safely on campus.', Icon: Handshake },
};

export default function CompletionVideo({ type = 'handover', itemTitle, onClose }) {
  const kind = type === 'delivery' ? 'delivery' : 'handover';
  const candidates = FILES[kind];
  const { title, sub, Icon } = COPY[kind];

  const videoRef = useRef(null);
  const [srcIndex, setSrcIndex] = useState(0);   // which candidate file we are trying
  const [ended, setEnded] = useState(false);

  const noVideo = srcIndex >= candidates.length; // every file failed to load -> fallback card
  const src = noVideo ? null : `${BASE}${candidates[srcIndex]}`;

  // Start playback; if the browser blocks sound-on autoplay, retry muted.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    }
  }, [src]);

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-[#0b1220] shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {noVideo ? (
          <div className="px-8 py-16 text-center text-white">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/40 flex items-center justify-center rl-fade-up">
              <Icon className="w-10 h-10 text-emerald-300" />
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mt-5" />
          </div>
        ) : (
          <video
            key={src}
            ref={videoRef}
            src={src}
            className="w-full max-h-[70vh] bg-black"
            autoPlay
            playsInline
            controls
            onEnded={() => setEnded(true)}
            onError={() => setSrcIndex((i) => i + 1)}
          />
        )}

        <div className="px-6 py-5 text-center text-white">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <p className="text-sm text-slate-300 mt-1">{sub}</p>
          {itemTitle && <p className="text-xs text-slate-400 mt-2 line-clamp-1">{itemTitle}</p>}
          <button
            onClick={onClose}
            className={`mt-4 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              ended || noVideo ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {ended || noVideo ? 'Continue' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
