'use client';

import { Box, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getCourseAssignments } from '../server/actions';
import AssessmentCard from './AssessmentCard';

type AssessmentsListProps = {
	courseId: number;
};

export default function AssessmentsList({ courseId }: AssessmentsListProps) {
	const { data: assignments, isLoading } = useQuery({
		queryKey: ['course-assignments', courseId],
		queryFn: () => getCourseAssignments(courseId),
	});

	if (isLoading) {
		return (
			<Box ta='center' py='xl'>
				<Loader />
			</Box>
		);
	}

	if (!assignments || assignments.length === 0) {
		return (
			<Box ta='center' py='xl'>
				<Text c='dimmed'>No assignments found for this course</Text>
			</Box>
		);
	}

	return (
		<Stack gap='md'>
			{assignments.map((assignment) => {
				return <AssessmentCard key={assignment.id} assignment={assignment} />;
			})}
		</Stack>
	);
}
