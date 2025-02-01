import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';

type Props = {
  status: Status;
};

export default function StatusBadge({ status }: Props) {
  return (
    <Badge
      className={cn('capitalize', getStatusColor(status))}
      variant='outline'
    >
      {status}
    </Badge>
  );
}

function getStatusColor(status: Status) {
  switch (status) {
    case 'approved':
      return 'bg-green-500/15 text-green-700 hover:bg-green-500/25';
    case 'rejected':
      return 'bg-red-500/15 text-red-700 hover:bg-red-500/25';
    case 'pending':
    default:
      return 'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25';
  }
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className='h-5 w-5 text-green-600' />;
    case 'rejected':
      return <XCircle className='h-5 w-5 text-red-600' />;
    case 'pending':
    default:
      return <Clock className='h-5 w-5 text-yellow-600' />;
  }
}
