import { useId, type KeyboardEvent, type ReactNode } from 'react';
import {
  buildWorkspaceStageItems,
  DEFAULT_WORKSPACE_STAGES,
  type WorkspaceStageDefinition,
  type WorkspaceStageId,
  type WorkspaceStageItem,
} from './WorkspaceStageNav.helpers';

export type WorkspaceStageNavVariant = 'default' | 'focus' | 'collapsible';

export interface WorkspaceStageNavProps {
  activeStageId: WorkspaceStageId;
  onStageChange: (stageId: WorkspaceStageId) => void;
  completedStageIds?: readonly WorkspaceStageId[];
  stages?: readonly WorkspaceStageDefinition[];
  variant?: WorkspaceStageNavVariant;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isStageDisabled?: (stage: WorkspaceStageItem) => boolean;
  label?: string;
  className?: string;
  mobile?: boolean;
}

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const statusLabel = (stage: WorkspaceStageItem) => {
  if (stage.status === 'completed') return '已完成';
  if (stage.status === 'current') return '目前階段';
  return '尚未完成';
};

function StageMark({ stage }: { stage: WorkspaceStageItem }) {
  return <span
    aria-hidden="true"
    className={cx(
      'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition',
      stage.status === 'current' && 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-500/30',
      stage.status === 'completed' && 'border-emerald-500 bg-emerald-500 text-white',
      stage.status === 'upcoming' && 'border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400',
    )}
  >{stage.status === 'completed' ? '✓' : stage.index + 1}</span>;
}

function DesktopStageButton({
  stage,
  disabled,
  compact,
  onClick,
  onKeyDown,
}: {
  stage: WorkspaceStageItem;
  disabled: boolean;
  compact: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return <button
    type="button"
    role="tab"
    aria-selected={stage.status === 'current'}
    aria-current={stage.status === 'current' ? 'step' : undefined}
    aria-label={`${stage.label}，${statusLabel(stage)}`}
    disabled={disabled}
    tabIndex={stage.status === 'current' ? 0 : -1}
    data-stage-id={stage.id}
    data-stage-status={stage.status}
    onClick={onClick}
    onKeyDown={onKeyDown}
    className={cx(
      'group flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
      stage.status === 'current' && 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
      stage.status !== 'current' && 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70',
      disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent',
    )}
  >
    <StageMark stage={stage} />
    {!compact && <span className="min-w-0">
      <strong className="block truncate text-xs">{stage.label}</strong>
      {stage.description && <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{stage.description}</span>}
    </span>}
  </button>;
}

function MobileStageButton({ stage, disabled, onClick }: {
  stage: WorkspaceStageItem;
  disabled: boolean;
  onClick: () => void;
}) {
  return <button
    type="button"
    aria-current={stage.status === 'current' ? 'step' : undefined}
    aria-label={`${stage.label}，${statusLabel(stage)}`}
    disabled={disabled}
    data-stage-id={stage.id}
    data-stage-status={stage.status}
    onClick={onClick}
    className={cx(
      'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500',
      stage.status === 'current' && 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200',
      stage.status !== 'current' && 'text-slate-500 dark:text-slate-400',
      disabled && 'cursor-not-allowed opacity-40',
    )}
  >
    <StageMark stage={stage} />
    <span className="w-full truncate text-[10px] font-semibold">{stage.shortLabel ?? stage.label}</span>
  </button>;
}

export function WorkspaceStageNav({
  activeStageId,
  onStageChange,
  completedStageIds = [],
  stages = DEFAULT_WORKSPACE_STAGES,
  variant = 'default',
  collapsed = false,
  onCollapsedChange,
  isStageDisabled = () => false,
  label = 'Workspace 階段',
  className = '',
  mobile = true,
}: WorkspaceStageNavProps) {
  const descriptionId = useId();
  const items = buildWorkspaceStageItems(activeStageId, completedStageIds, stages);
  const canCollapse = variant === 'collapsible';
  const compact = variant === 'focus' || (canCollapse && collapsed);

  const focusStage = (index: number) => {
    if (typeof document === 'undefined') return;
    const stage = items[index];
    if (!stage) return;
    document.querySelector<HTMLButtonElement>(`[data-workspace-stage-nav="${descriptionId}"] [data-stage-id="${stage.id}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyDirection = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!keyDirection && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + keyDirection + items.length) % items.length;
    focusStage(target);
  };

  return <>
    <nav
      aria-label={label}
      aria-describedby={descriptionId}
      data-workspace-stage-nav={descriptionId}
      className={cx(
        'rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95',
        mobile && 'mb-20 md:mb-0',
        className,
      )}
    >
      <span id={descriptionId} className="sr-only">五階段創作流程，可切換已開放的階段。</span>
      <div className="flex items-center gap-2">
        <div role="tablist" aria-orientation="horizontal" className={cx('grid min-w-0 flex-1 gap-1', compact ? 'grid-cols-5' : 'grid-cols-2 lg:grid-cols-5')}>
          {items.map((stage, index) => <DesktopStageButton
            key={stage.id}
            stage={stage}
            compact={compact}
            disabled={isStageDisabled(stage)}
            onClick={() => onStageChange(stage.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          />)}
        </div>
        {canCollapse && <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? '展開階段導覽' : '收合階段導覽'}
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-sm text-slate-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:hover:bg-slate-800"
        >{collapsed ? '›' : '‹'}</button>}
      </div>
    </nav>

    {mobile && <nav aria-label={`${label}（行動版）`} className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-xl gap-0.5">
        {items.map((stage) => <MobileStageButton
          key={stage.id}
          stage={stage}
          disabled={isStageDisabled(stage)}
          onClick={() => onStageChange(stage.id)}
        />)}
      </div>
    </nav>}
  </>;
}

export interface WorkspaceStageProps {
  id: WorkspaceStageId;
  activeStageId: WorkspaceStageId;
  children: ReactNode;
  className?: string;
  keepMounted?: boolean;
}

export function WorkspaceStage({ id, activeStageId, children, className = '', keepMounted = false }: WorkspaceStageProps) {
  const active = id === activeStageId;
  if (!active && !keepMounted) return null;
  return <section
    id={`workspace-stage-${id}`}
    aria-label={`${id} workspace stage`}
    hidden={!active}
    data-workspace-stage={id}
    className={className}
  >{children}</section>;
}
