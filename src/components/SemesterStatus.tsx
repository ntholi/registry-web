import { Badge } from '@mantine/core';
import { semesterStatusEnum } from '@/db/schema';

type SemesterStatus = typeof semesterStatusEnum.enumValues[number];

type Props = {
  status: SemesterStatus;
};

export default function SemesterStatusView({ status }: Props) {
  const getColor = (status: SemesterStatus) => {
    switch (status) {
      case 'Active':
      case 'Enrolled':
        return 'gray';
      case 'Outstanding':
        return 'dark';
      case 'Deleted':
      case 'Inactive':
      case 'DNR':
      case 'DroppedOut':
        return 'red';
      case 'Deferred':
        return 'yellow';
      case 'Exempted':
        return 'blue';
      case 'Repeat':
        return 'violet';
      default:
        return 'gray';
    }
  };

  return (
    <Badge color={getColor(status)} size='sm'>
      {status}
    </Badge>
  );
}
