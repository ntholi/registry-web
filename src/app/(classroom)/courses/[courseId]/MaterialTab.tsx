'use client';

import {
	Accordion,
	Badge,
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import type { CourseWork, Topic } from '@/server/classroom/actions';

type Props = {
	materials: CourseWork[];
	topics: Topic[];
	courseId: string;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export default function MaterialTab({ materials, topics, courseId }: Props) {
	const topicMap = new Map(
		topics.map((t) => [t.topicId, t.name || 'Untitled'])
	);

	const groupedByTopic = materials.reduce(
		(acc, material) => {
			const topicId = material.topicId || 'no-topic';
			if (!acc[topicId]) {
				acc[topicId] = [];
			}
			acc[topicId].push(material);
			return acc;
		},
		{} as Record<string, CourseWork[]>
	);

	const sortedTopics = Object.keys(groupedByTopic).sort((a, b) => {
		if (a === 'no-topic') return 1;
		if (b === 'no-topic') return -1;
		return 0;
	});

	if (materials.length === 0) {
		return (
			<Stack gap='md'>
				<Group justify='space-between'>
					<Title order={3} size='h4'>
						Material
					</Title>
					<Button leftSection={<IconPlus size='1rem' />} variant='light'>
						Create
					</Button>
				</Group>
				<Paper p='xl' radius='md' withBorder>
					<Text c='dimmed' ta='center'>
						No materials yet
					</Text>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Group justify='space-between'>
				<Title order={3} size='h4'>
					Material
				</Title>
				<Button leftSection={<IconPlus size='1rem' />} variant='light'>
					Create
				</Button>
			</Group>

			{sortedTopics.map((topicId) => {
				const topicName =
					topicId === 'no-topic' ? 'General' : topicMap.get(topicId) || 'Topic';
				const topicMaterials = groupedByTopic[topicId];

				return (
					<Box key={topicId}>
						<Group mb='md'>
							<Text size='lg' fw={600}>
								{topicName}
							</Text>
							<Badge variant='light' size='md'>
								{topicMaterials.length}
							</Badge>
						</Group>

						<Paper withBorder radius='md'>
							<Accordion variant='contained'>
								{topicMaterials.map((material) => (
									<Accordion.Item key={material.id} value={material.id || ''}>
										<Accordion.Control>
											<Group justify='space-between' wrap='nowrap' pr='md'>
												<Box style={{ flex: 1 }}>
													<Text fw={500} mb='xs'>
														{material.title}
													</Text>
													<Group gap='xs'>
														{material.materials &&
															material.materials.length > 0 && (
																<Badge size='sm' variant='outline'>
																	{material.materials.length} attachment
																	{material.materials.length > 1 ? 's' : ''}
																</Badge>
															)}
														<Text size='xs' c='dimmed'>
															{formatDate(material.creationTime)}
														</Text>
													</Group>
												</Box>
											</Group>
										</Accordion.Control>
										<Accordion.Panel>
											<Stack gap='md'>
												{material.description && (
													<Text size='sm' c='dimmed'>
														{material.description}
													</Text>
												)}

												<Group justify='flex-end'>
													<Button
														component={Link}
														href={`/courses/${courseId}/${material.id}`}
														variant='light'
														size='sm'
													>
														View Details
													</Button>
												</Group>
											</Stack>
										</Accordion.Panel>
									</Accordion.Item>
								))}
							</Accordion>
						</Paper>
					</Box>
				);
			})}
		</Stack>
	);
}
