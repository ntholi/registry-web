import { Skeleton, Stack } from '@mantine/core';
import { Suspense } from 'react';
import { getCourseAnnouncements } from '../../server/actions';
import DashboardTab from './DashboardTab';

type Props = {
	courseId: string;
};

async function DashboardContent({ courseId }: Props) {
	const announcements = await getCourseAnnouncements(courseId);
	return <DashboardTab announcements={announcements} />;
}

function DashboardSkeleton() {
	return (
		<Stack gap='lg'>
			{[0, 1, 2].map((i) => (
				<Skeleton key={i} height={150} radius='lg' />
			))}
		</Stack>
	);
}

export default function DashboardTabWrapper({ courseId }: Props) {
	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<DashboardContent courseId={courseId} />
		</Suspense>
	);
}
