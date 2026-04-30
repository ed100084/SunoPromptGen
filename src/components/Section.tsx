import type { ReactNode } from 'react';

interface Props {
  title: string;
  hint?: string;
  children: ReactNode;
  id?: string;
}

export function Section({ title, hint, children, id }: Props) {
  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 mb-4"
    >
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
        {title}
      </h3>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}
