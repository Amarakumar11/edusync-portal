import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'swaps_pending' | 'pending_hod' | 'pending_principal' | 'approved' | 'rejected' | 'cancelled' | 'pending';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, any> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    swaps_pending: 'bg-orange-100 text-orange-800',
    pending_hod: 'bg-amber-100 text-amber-800',
    pending_principal: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    swaps_pending: 'Swaps Pending',
    pending_hod: 'Pending HOD',
    pending_principal: 'Pending Principal',
    cancelled: 'Cancelled',
  };

  return (
    <Badge className={`${variants[status]} capitalize`}>
      {labels[status]}
    </Badge>
  );
}
