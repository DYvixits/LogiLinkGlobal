import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { STATUS_BADGE } from '../lib/status';
import { cn } from '../lib/utils';

export const StatusBadge = ({ status, className }) => {
  const { t } = useLanguage();
  const classes = STATUS_BADGE[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
        classes,
        className
      )}
    >
      {t(`status_${status}`) || status}
    </span>
  );
};
