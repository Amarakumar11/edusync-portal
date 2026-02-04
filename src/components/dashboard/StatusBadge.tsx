import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, any> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <Badge className={`${variants[status]} capitalize`}>
      {labels[status]}
    </Badge>
  );
}
