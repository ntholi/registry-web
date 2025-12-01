'use client';

import {
	Box,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconBook2, IconFileText } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { initializeCourseOutline } from '../server/actions';
import SectionCard from './SectionCard';
import SectionForm from './SectionForm';
import TopicForm from './TopicForm';
import TopicsTable from './TopicsTable';

type CourseOutlineProps = {
	courseId: number;
};

function SectionCardSkeleton() {
	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Group align='flex-start' wrap='nowrap'>
					<Skeleton height={48} width={48} radius='md' />
					<Box style={{ flex: 1 }}>
						<Skeleton height={16} width='70%' mb='xs' />
						<Skeleton height={12} width='100%' />
						<Skeleton height={12} width='80%' mt={4} />
					</Box>
				</Group>
			</Stack>
		</Card>
	);
}

function TopicsTableSkeleton() {
	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Skeleton height={36} />
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} height={50} />
				))}
			</Stack>
		</Paper>
	);
}

export default function CourseOutline({ courseId }: CourseOutlineProps) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['course-outline', courseId],
		queryFn: () => initializeCourseOutline(courseId),
	});

	if (isLoading) {
		return (
			<Stack gap='xl'>
				<Box>
					<Group justify='space-between' mb='md'>
						<Title order={4}>Course Sections</Title>
					</Group>
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
						{[1, 2, 3].map((i) => (
							<SectionCardSkeleton key={i} />
						))}
					</SimpleGrid>
				</Box>
				<Box>
					<Group justify='space-between' mb='md'>
						<Title order={4}>Weekly Topics</Title>
					</Group>
					<TopicsTableSkeleton />
				</Box>
			</Stack>
		);
	}

	if (error) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconBook2 size={48} stroke={1} style={{ opacity: 0.5 }} />
					<Text c='red' size='sm'>
						Failed to load course outline
					</Text>
					<Text c='dimmed' size='xs'>
						{error.message}
					</Text>
				</Stack>
			</Paper>
		);
	}

	const { sections, topics } = data || { sections: [], topics: [] };

	return (
		<Stack gap='xl'>
			<Box>
				<Group justify='space-between' mb='md'>
					<Group gap='xs'>
						<IconFileText size={20} stroke={1.5} />
						<Title order={4}>Course Sections</Title>
					</Group>
					<SectionForm courseId={courseId} />
				</Group>
				{sections.length === 0 ? (
					<Paper p='xl' withBorder>
						<Stack align='center' gap='sm'>
							<IconFileText size={48} stroke={1} style={{ opacity: 0.5 }} />
							<Text c='dimmed' size='sm'>
								No sections added yet
							</Text>
							<Text c='dimmed' size='xs'>
								Add sections to define the course structure
							</Text>
						</Stack>
					</Paper>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
						{sections.map((section) => (
							<SectionCard key={section.id} section={section} />
						))}
					</SimpleGrid>
				)}
			</Box>

			<Box>
				<Group justify='space-between' mb='md'>
					<Group gap='xs'>
						<IconBook2 size={20} stroke={1.5} />
						<Title order={4}>Weekly Topics</Title>
					</Group>
					<TopicForm courseId={courseId} nextWeekNumber={topics.length + 1} />
				</Group>
				<TopicsTable topics={topics} />
			</Box>
		</Stack>
	);
}
