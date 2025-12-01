'use client';

import { Box, Group, Stack, Title } from '@mantine/core';
import SectionForm from './SectionForm';
import SectionList from './SectionList';
import TopicForm from './TopicForm';
import TopicsTable from './TopicsTable';

type CourseOutlineProps = {
	courseId: number;
};

export default function CourseOutline({ courseId }: CourseOutlineProps) {
	return (
		<Stack gap='xl'>
			<Box>
				<Group justify='space-between' mb='md'>
					<Title order={4}>Course Sections</Title>
					<SectionForm courseId={courseId} />
				</Group>
				<SectionList courseId={courseId} />
			</Box>

			<Box>
				<Group justify='space-between' mb='md'>
					<Title order={4}>Course Topics</Title>
					<TopicForm courseId={courseId} />
				</Group>
				<TopicsTable courseId={courseId} />
			</Box>
		</Stack>
	);
}
