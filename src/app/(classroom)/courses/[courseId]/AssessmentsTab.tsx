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
	assessments: CourseWork[];
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

function getWorkTypeLabel(workType: string | null | undefined) {
	switch (workType) {
		case 'ASSIGNMENT':
			return 'Assignment';
		case 'SHORT_ANSWER_QUESTION':
			return 'Question';
		case 'MULTIPLE_CHOICE_QUESTION':
			return 'Quiz';
		default:
			return 'Work';
	}
}

export default function AssessmentsTab({
	assessments,
	topics,
	courseId,
}: Props) {
	const topicMap = new Map(
		topics.map((t) => [t.topicId, t.name || 'Untitled'])
	);

	const groupedByTopic = assessments.reduce(
		(acc, assessment) => {
			const topicId = assessment.topicId || 'no-topic';
			if (!acc[topicId]) {
				acc[topicId] = [];
			}
			acc[topicId].push(assessment);
			return acc;
		},
		{} as Record<string, CourseWork[]>
	);

	const sortedTopics = Object.keys(groupedByTopic).sort((a, b) => {
		if (a === 'no-topic') return 1;
		if (b === 'no-topic') return -1;
		return 0;
	});

	if (assessments.length === 0) {
		return (
			<Stack gap='md'>
				<Group justify='space-between'>
					<Title order={3} size='h4'>
						Assessments
					</Title>
					<Button leftSection={<IconPlus size='1rem' />} variant='light'>
						Create
					</Button>
				</Group>
				<Paper p='xl' radius='md' withBorder>
					<Text c='dimmed' ta='center'>
						No assessments yet
					</Text>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Group justify='space-between'>
				<Title order={3} size='h4'>
					Assessments
				</Title>
				<Button leftSection={<IconPlus size='1rem' />} variant='light'>
					Create
				</Button>
			</Group>

			{sortedTopics.map((topicId) => {
				const topicName =
					topicId === 'no-topic' ? 'General' : topicMap.get(topicId) || 'Topic';
				const topicAssessments = groupedByTopic[topicId];

				return (
					<Box key={topicId}>
						<Group mb='md'>
							<Text size='lg' fw={600}>
								{topicName}
							</Text>
							<Badge variant='light' size='md'>
								{topicAssessments.length}
							</Badge>
						</Group>

						<Paper withBorder radius='md'>
							<Accordion variant='contained'>
								{topicAssessments.map((assessment) => (
									<Accordion.Item
										key={assessment.id}
										value={assessment.id || ''}
									>
										<Accordion.Control>
											<Group justify='space-between' wrap='nowrap' pr='md'>
												<Box style={{ flex: 1 }}>
													<Text fw={500} mb='xs'>
														{assessment.title}
													</Text>
													<Group gap='xs'>
														<Badge size='sm' variant='light'>
															{getWorkTypeLabel(assessment.workType)}
														</Badge>
														{assessment.maxPoints && (
															<Badge size='sm' variant='outline'>
																{assessment.maxPoints} pts
															</Badge>
														)}
														<Text size='xs' c='dimmed'>
															{formatDate(assessment.creationTime)}
														</Text>
													</Group>
												</Box>
											</Group>
										</Accordion.Control>
										<Accordion.Panel>
											<Stack gap='md'>
												{assessment.description && (
													<Text size='sm' c='dimmed'>
														{assessment.description}
													</Text>
												)}

												{assessment.dueDate && (
													<Text size='sm'>
														<Text component='span' fw={500}>
															Due:
														</Text>{' '}
														{formatDate(
															new Date(
																assessment.dueDate.year || 0,
																(assessment.dueDate.month || 1) - 1,
																assessment.dueDate.day || 1
															).toISOString()
														)}
													</Text>
												)}

												<Group justify='flex-end'>
													<Button
														component={Link}
														href={`/courses/${courseId}/${assessment.id}`}
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
