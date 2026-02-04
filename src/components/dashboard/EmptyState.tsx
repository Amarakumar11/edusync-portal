import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <Alert className="border-dashed">
      {icon || <AlertCircle className="h-4 w-4" />}
      <AlertDescription>
        <div className="font-semibold">{title}</div>
        {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
      </AlertDescription>
    </Alert>
  );
}
