'use client';

import { Center, Loader, Paper, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssignedModuleByCourseId } from '../server/actions';
import LMSStudentTable from './LMSStudentTable';

type GradebookProps = {
	courseId: number;
};

export default function Gradebook({ courseId }: GradebookProps) {
	const { data: assignedModule, isLoading } = useQuery({
		queryKey: ['assigned-module-by-course', courseId],
		queryFn: () => getAssignedModuleByCourseId(courseId),
	});

	if (isLoading) {
		return (
			<Center py='xl'>
				<Loader />
			</Center>
		);
	}

	if (!assignedModule) {
		return (
			<Center py='xl'>
				<Text c='dimmed'>
					This course is not linked to a module. Please link the course to a
					module in the Academic section to use the gradebook.
				</Text>
			</Center>
		);
	}

	const moduleId = assignedModule.semesterModule?.moduleId;
	const semesterModuleId = assignedModule.semesterModuleId;

	if (!moduleId || !semesterModuleId) {
		return (
			<Center py='xl'>
				<Text c='dimmed'>
					Module information is not available for this course.
				</Text>
			</Center>
		);
	}

	return (
		<Paper withBorder shadow='sm' p='lg' bg={'dark.8'}>
			<LMSStudentTable
				courseId={courseId}
				moduleId={moduleId}
				semesterModuleIds={[semesterModuleId]}
			/>
		</Paper>
	);
}
