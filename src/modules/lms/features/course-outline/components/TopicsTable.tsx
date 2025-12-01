'use client';

import {
	Badge,
	Box,
	Paper,
	Stack,
	Table,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { IconListDetails } from '@tabler/icons-react';
import type { CourseTopic } from '../types';

type TopicsTableProps = {
	topics: CourseTopic[];
};

export default function TopicsTable({ topics }: TopicsTableProps) {
	if (topics.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconListDetails size={48} stroke={1} style={{ opacity: 0.5 }} />
					<Text c='dimmed' size='sm'>
						No topics added yet
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Table highlightOnHover withTableBorder withColumnBorders>
			<Table.Thead>
				<Table.Tr>
					<Table.Th w={100}>Week</Table.Th>
					<Table.Th w={250}>Topic</Table.Th>
					<Table.Th>Content</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{topics.map((topic) => (
					<Table.Tr key={topic.id}>
						<Table.Td>
							<Badge variant='light' size='lg'>
								Week {topic.weekNumber}
							</Badge>
						</Table.Td>
						<Table.Td>
							<Text size='sm' fw={500}>
								{topic.title}
							</Text>
						</Table.Td>
						<Table.Td>
							<Box>
								<TypographyStylesProvider fz='sm'>
									<div
										dangerouslySetInnerHTML={{ __html: topic.description }}
									/>
								</TypographyStylesProvider>
							</Box>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
