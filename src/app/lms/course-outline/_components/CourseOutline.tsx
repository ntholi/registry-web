'use client';

import { Box, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getCourseOutline } from '../_server/actions';
import CourseSections from './CourseSections';
import CourseTopics from './CourseTopics';
import SectionForm from './SectionForm';
import TopicForm from './TopicForm';

type CourseOutlineProps = {
	courseId: number;
};

export default function CourseOutline({ courseId }: CourseOutlineProps) {
	const { data, isLoading } = useQuery({
		queryKey: ['course-outline', courseId],
		queryFn: () => getCourseOutline(courseId),
	});

	const sections = data?.sections ?? [];
	const topics = data?.topics ?? [];

	const nextSectionNumber =
		sections.length > 0 ? Math.max(...sections.map((s) => s.pagenum)) + 1 : 1;

	const nextWeekNumber =
		topics.length > 0 ? Math.max(...topics.map((t) => t.weekNumber)) + 1 : 1;

	return (
		<Stack gap='xl'>
			<Paper p='md' withBorder>
				<Group justify='space-between' mb='md'>
					<Box>
						<Title order={4}>Sections</Title>
						<Text size='sm' c='dimmed'>
							Course sections displayed as chapters in the outline
						</Text>
					</Box>
					<SectionForm
						courseId={courseId}
						nextSectionNumber={nextSectionNumber}
					/>
				</Group>
				<Divider mb='md' />
				<CourseSections sections={sections} isLoading={isLoading} />
			</Paper>

			<Paper p='md' withBorder>
				<Group justify='space-between' mb='md'>
					<Box>
						<Title order={4}>Topics</Title>
						<Text size='sm' c='dimmed'>
							Weekly topics covered in the course
						</Text>
					</Box>
					<TopicForm courseId={courseId} nextWeekNumber={nextWeekNumber} />
				</Group>
				<Divider mb='md' />
				<CourseTopics topics={topics} isLoading={isLoading} />
			</Paper>
		</Stack>
	);
}
