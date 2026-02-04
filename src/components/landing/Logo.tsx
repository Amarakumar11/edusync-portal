import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant = 'dark', size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-lg p-1.5',
        variant === 'light' ? 'bg-primary-foreground/10' : 'bg-primary/10'
      )}>
        <GraduationCap className={cn(
          iconSizes[size],
          variant === 'light' ? 'text-primary-foreground' : 'text-primary'
        )} />
      </div>
      <span className={cn(
        'font-display font-bold tracking-tight',
        sizeClasses[size],
        variant === 'light' ? 'text-primary-foreground' : 'text-foreground'
      )}>
        Edu<span className={cn(
          variant === 'light' ? 'text-primary-foreground/80' : 'text-primary'
        )}>Sync</span>
      </span>
    </div>
  );
}
