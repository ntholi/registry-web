'use client';
import {
	Accordion,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Stack,
	Text,
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
	if (!dateString) return 'No date';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
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

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Text size='lg' fw={500}>
					Assessments
				</Text>
				<Button leftSection={<IconPlus size='1rem' />} variant='light'>
					Create
				</Button>
			</Group>

			{assessments.length === 0 ? (
				<Card>
					<Text c='dimmed'>No assessments yet</Text>
				</Card>
			) : (
				<Accordion variant='separated' chevronPosition='left'>
					{sortedTopics.map((topicId) => {
						const topicName =
							topicId === 'no-topic'
								? 'General'
								: topicMap.get(topicId) || 'Topic';
						const topicAssessments = groupedByTopic[topicId];

						return (
							<Accordion.Item key={topicId} value={topicId}>
								<Accordion.Control>
									<Group justify='space-between'>
										<Text fw={500}>{topicName}</Text>
										<Badge size='sm' variant='light'>
											{topicAssessments.length}
										</Badge>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap='xs'>
										{topicAssessments.map((assessment) => (
											<Card
												key={assessment.id}
												component={Link}
												href={`/courses/${courseId}/${assessment.id}`}
												withBorder
												padding='md'
												style={{ cursor: 'pointer' }}
											>
												<Group justify='space-between' wrap='nowrap'>
													<Box style={{ flex: 1 }}>
														<Group gap='xs' mb='xs'>
															<Badge size='sm' variant='dot'>
																{getWorkTypeLabel(assessment.workType)}
															</Badge>
															{assessment.maxPoints && (
																<Badge size='sm' variant='outline'>
																	{assessment.maxPoints} pts
																</Badge>
															)}
														</Group>
														<Text fw={500} size='sm' lineClamp={2}>
															{assessment.title}
														</Text>
														{assessment.description && (
															<Text size='xs' c='dimmed' lineClamp={1} mt='xs'>
																{assessment.description}
															</Text>
														)}
													</Box>
													<Text
														size='xs'
														c='dimmed'
														style={{ whiteSpace: 'nowrap' }}
													>
														{formatDate(assessment.creationTime)}
													</Text>
												</Group>
											</Card>
										))}
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>
			)}
		</Stack>
	);
}
