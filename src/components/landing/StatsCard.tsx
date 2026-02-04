import { cn } from '@/lib/utils';

interface StatsCardProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatsCard({ value, label, delay = 0 }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "text-center p-6 opacity-0 animate-fade-in-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="font-display text-4xl font-bold text-primary-foreground mb-2">
        {value}
      </div>
      <div className="text-sm text-primary-foreground/70">{label}</div>
    </div>
  );
}
