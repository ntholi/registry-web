import { Skeleton, Stack } from '@mantine/core';
import { Suspense } from 'react';
import { getCourseTopics, getCourseWork } from '../../server/actions';
import MaterialTab from './MaterialTab';

type Props = {
	courseId: string;
};

async function MaterialContent({ courseId }: Props) {
	const [courseWork, topics] = await Promise.all([
		getCourseWork(courseId),
		getCourseTopics(courseId),
	]);

	const materials = courseWork.filter((work) => work.workType === 'MATERIAL');

	return (
		<MaterialTab materials={materials} topics={topics} courseId={courseId} />
	);
}

function MaterialSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={40} width={200} radius='md' />
			{[...Array(4)].map((_, i) => (
				<Skeleton key={i} height={120} radius='lg' />
			))}
		</Stack>
	);
}

export default function MaterialTabWrapper({ courseId }: Props) {
	return (
		<Suspense fallback={<MaterialSkeleton />}>
			<MaterialContent courseId={courseId} />
		</Suspense>
	);
}
