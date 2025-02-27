import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Info, XCircle } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | 'registered';

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
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800';
    case 'rejected':
      return 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800';
    case 'pending':
    default:
      return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800';
  }
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return <Info className='h-5 w-5 text-blue-600 dark:text-blue-400' />;
    case 'rejected':
      return <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />;
    case 'pending':
    default:
      return <Clock className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />;
  }
}
