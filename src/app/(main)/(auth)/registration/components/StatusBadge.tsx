import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

type Status = 'success' | 'info' | 'warning' | 'danger';
type StatusMapping =
  | 'pending'
  | 'partial'
  | 'approved'
  | 'rejected'
  | 'registered';

type Props = {
  status: Status | StatusMapping;
  statusType?: Status;
  customText?: string;
};

export default function StatusBadge({ status, statusType, customText }: Props) {
  const mappedStatus = statusType || mapToStatusType(status);

  return (
    <Badge
      className={cn('capitalize', getStatusColor(mappedStatus))}
      variant='outline'
    >
      {customText || status}
    </Badge>
  );
}

function mapToStatusType(status: Status | StatusMapping): Status {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'partial':
      return 'info';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'registered':
      return 'success';
    default:
      return status as Status;
  }
}

function getStatusColor(status: Status) {
  switch (status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-950/40 border-green-200 dark:border-green-800';
    case 'info':
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800';
    case 'danger':
      return 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800';
    case 'warning':
    default:
      return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800';
  }
}

export function getStatusIcon(status: string, statusType?: Status) {
  const mappedStatus =
    statusType ||
    (typeof status === 'string'
      ? mapToStatusType(status as Status | StatusMapping)
      : 'warning');

  switch (mappedStatus) {
    case 'success':
      return (
        <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
      );
    case 'info':
      return <Info className='h-5 w-5 text-blue-600 dark:text-blue-400' />;
    case 'danger':
      return <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />;
    case 'warning':
    default:
      return (
        <AlertTriangle className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
      );
  }
}
