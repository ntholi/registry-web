import { Skeleton, Stack } from '@mantine/core';
import { Suspense } from 'react';
import { getCourseTopics, getCourseWork } from '../../server/actions';
import AssessmentsTab from './AssessmentsTab';

type Props = {
	courseId: string;
};

async function AssessmentsContent({ courseId }: Props) {
	const [courseWork, topics] = await Promise.all([
		getCourseWork(courseId),
		getCourseTopics(courseId),
	]);

	const assessments = courseWork.filter(
		(work) =>
			work.workType === 'ASSIGNMENT' ||
			work.workType === 'SHORT_ANSWER_QUESTION' ||
			work.workType === 'MULTIPLE_CHOICE_QUESTION'
	);

	return (
		<AssessmentsTab
			assessments={assessments}
			topics={topics}
			courseId={courseId}
		/>
	);
}

function AssessmentsSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={40} width={200} radius='md' />
			{[0, 1, 2, 3].map((i) => (
				<Skeleton key={i} height={120} radius='lg' />
			))}
		</Stack>
	);
}

export default function AssessmentsTabWrapper({ courseId }: Props) {
	return (
		<Suspense fallback={<AssessmentsSkeleton />}>
			<AssessmentsContent courseId={courseId} />
		</Suspense>
	);
}
