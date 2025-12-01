'use client';

import {
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { IconListDetails } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCourseTopics } from '../server/actions';

type TopicsTableProps = {
	courseId: number;
};

function TopicsTableSkeleton() {
	return (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Week</Table.Th>
					<Table.Th>Topic</Table.Th>
					<Table.Th>Content</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{[1, 2, 3].map((i) => (
					<Table.Tr key={i}>
						<Table.Td>
							<Skeleton height={20} width={40} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={20} width={200} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={40} />
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

export default function TopicsTable({ courseId }: TopicsTableProps) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	const { data: topics, isLoading } = useQuery({
		queryKey: ['course-topics', courseId],
		queryFn: () => getCourseTopics(courseId),
	});

	if (isLoading) {
		return <TopicsTableSkeleton />;
	}

	if (!topics || topics.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconListDetails
						size={48}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='md' fw={500}>
						No topics yet
					</Text>
					<Text c='dimmed' size='sm' ta='center'>
						Add your first course topic to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Table striped highlightOnHover withTableBorder withColumnBorders>
			<Table.Thead>
				<Table.Tr>
					<Table.Th w={80}>Week</Table.Th>
					<Table.Th w={200}>Topic</Table.Th>
					<Table.Th>Content</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{topics.map((topic) => (
					<Table.Tr key={topic.coursemoduleId}>
						<Table.Td>
							<Text fw={600}>Week {topic.weekNumber}</Text>
						</Table.Td>
						<Table.Td>
							<Text fw={500}>{topic.name}</Text>
						</Table.Td>
						<Table.Td>
							<div
								style={{
									padding: theme.spacing.xs,
									backgroundColor:
										colorScheme === 'dark'
											? theme.colors.dark[6]
											: theme.colors.gray[0],
									borderRadius: theme.radius.sm,
								}}
								dangerouslySetInnerHTML={{
									__html: topic.description || 'No description',
								}}
							/>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
