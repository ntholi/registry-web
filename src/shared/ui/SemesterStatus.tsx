import { Badge } from '@mantine/core';
import { getSemesterStatusColor } from '@student-portal/utils';
import type { semesterStatus } from '@/core/database';

type SemesterStatus = (typeof semesterStatus.enumValues)[number];

type Props = {
	status: SemesterStatus;
};

export default function SemesterStatusView({ status }: Props) {
	return (
		<Badge color={getSemesterStatusColor(status)} size='sm'>
			{status}
		</Badge>
	);
}
