'use client';

import {
	Box,
	Skeleton,
	Stack,
	Table,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { IconList } from '@tabler/icons-react';
import type { CourseTopic } from '../types';

type CourseTopicsProps = {
	topics: CourseTopic[];
	isLoading?: boolean;
};

function TopicsTableSkeleton() {
	return (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th w={100}>Week</Table.Th>
					<Table.Th w={200}>Topic</Table.Th>
					<Table.Th>Content</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{[1, 2, 3, 4].map((i) => (
					<Table.Tr key={i}>
						<Table.Td>
							<Skeleton height={16} width={40} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={16} width={150} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={16} width='100%' />
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

export default function CourseTopics({ topics, isLoading }: CourseTopicsProps) {
	const theme = useMantineTheme();

	if (isLoading) {
		return <TopicsTableSkeleton />;
	}

	if (topics.length === 0) {
		return (
			<Box py='xl' ta='center'>
				<Stack align='center' gap='sm'>
					<IconList
						size={48}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='sm'>
						No topics added yet
					</Text>
				</Stack>
			</Box>
		);
	}

	const sortedTopics = [...topics].sort((a, b) => a.weekNumber - b.weekNumber);

	return (
		<Table striped highlightOnHover withTableBorder withColumnBorders>
			<Table.Thead>
				<Table.Tr>
					<Table.Th w={100}>Week</Table.Th>
					<Table.Th w={250}>Topic</Table.Th>
					<Table.Th>Content</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{sortedTopics.map((topic) => (
					<Table.Tr key={topic.id}>
						<Table.Td>
							<Text fw={600} size='sm'>
								Week {topic.weekNumber}
							</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm' fw={500}>
								{topic.title}
							</Text>
						</Table.Td>
						<Table.Td>
							<Box>
								<div
									dangerouslySetInnerHTML={{ __html: topic.description }}
									style={{ fontSize: theme.fontSizes.sm }}
								/>
							</Box>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
