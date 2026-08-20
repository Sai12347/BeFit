import { ReactNode } from 'react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} rounded-full border-neutral-200 border-t-primary-600 animate-spin`}
      />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-display font-semibold text-neutral-800 mb-1">{title}</h3>
      <p className="text-neutral-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-display font-semibold text-neutral-800 mb-1">Something went wrong</h3>
      <p className="text-neutral-500 max-w-sm">{message}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  color = 'bg-primary-500',
}: {
  value: number;
  max: number;
  label?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-neutral-600 font-medium">{label}</span>
          <span className={`font-semibold ${over ? 'text-red-500' : 'text-neutral-700'}`}>
            {Math.round(value)} / {max}
          </span>
        </div>
      )}
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? 'bg-red-400' : color} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MacroRing({
  consumed,
  goal,
  label,
  unit = '',
  size = 120,
  color = '#22c55e',
}: {
  consumed: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
  color?: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const dashoffset = circumference * (1 - pct);
  const remaining = Math.max(0, goal - consumed);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f5f5f4"
            strokeWidth="10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-neutral-800">
            {Math.round(consumed)}
          </span>
          <span className="text-xs text-neutral-400">
            / {goal}{unit}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-neutral-600 mt-2">{label}</span>
      <span className="text-xs text-neutral-400">{remaining} remaining</span>
    </div>
  );
}
