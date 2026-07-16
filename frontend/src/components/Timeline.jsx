import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { STATUS_FLOW, statusIndex, isException, statusDotColor } from '../lib/status';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

const fmt = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

// Builds a display timeline: prefer real history, else synthesize from current status.
export const Timeline = ({ parcel }) => {
  const { t } = useLanguage();
  const history = Array.isArray(parcel?.history) ? parcel.history : [];

  let items = history;
  if (items.length === 0) {
    const idx = statusIndex(parcel?.status);
    items = STATUS_FLOW.slice(0, idx + 1).map((s) => ({ status: s, timestamp: null, author: '' }));
  }
  const currentIndex = items.length - 1;

  return (
    <div data-testid="parcel-timeline" className="relative pl-6 border-l-2 border-slate-100 space-y-6">
      {items.map((h, i) => {
        const active = i === currentIndex;
        const exception = isException(h.status);
        return (
          <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div
              className={cn(
                "absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-white",
                active ? (exception ? "bg-red-500" : statusDotColor(h.status)) : "bg-slate-300"
              )}
            >
              {!exception && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={cn("font-medium leading-tight", active ? "text-slate-900" : "text-slate-500")}>
                {t(`status_${h.status}`) || h.status}
              </span>
              {h.timestamp && <span className="text-xs font-mono text-slate-400">{fmt(h.timestamp)}</span>}
              {h.author && <span className="text-xs text-slate-400">{h.author}{h.comment ? ` — ${h.comment}` : ''}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
