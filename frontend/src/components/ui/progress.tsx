export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-border/60 ${className}`}>
      <div
        className="bg-gradient-to-r from-secondary to-primary h-full transition-all duration-300 shadow-cyan"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
