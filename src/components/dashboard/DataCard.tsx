import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DataCard({ title, children, action, className, contentClassName }: DataCardProps) {
  return (
    <div className={cn('dashboard-card', className)}>
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border">
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className={cn('p-4 lg:p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export default DataCard;
