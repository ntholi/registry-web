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
		<Stack gap='lg'>
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
				<Stack gap='xl'>
					{sortedTopics.map((topicId) => {
						const topicName =
							topicId === 'no-topic'
								? 'General'
								: topicMap.get(topicId) || 'Topic';
						const topicAssessments = groupedByTopic[topicId];

						return (
							<Box key={topicId}>
								<Group mb='md' gap='sm'>
									<Text size='md' fw={600} c='blue'>
										{topicName}
									</Text>
									<Badge size='sm' variant='light'>
										{topicAssessments.length}
									</Badge>
								</Group>

								<Accordion variant='separated' chevronPosition='right'>
									{topicAssessments.map((assessment) => (
										<Accordion.Item
											key={assessment.id}
											value={assessment.id || ''}
										>
											<Accordion.Control>
												<Group justify='space-between' wrap='nowrap' mr='md'>
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
													</Box>
													<Text
														size='xs'
														c='dimmed'
														style={{ whiteSpace: 'nowrap' }}
													>
														{formatDate(assessment.creationTime)}
													</Text>
												</Group>
											</Accordion.Control>
											<Accordion.Panel>
												<Stack gap='sm'>
													{assessment.description && (
														<Text size='sm' c='dimmed'>
															{assessment.description}
														</Text>
													)}

													{assessment.materials &&
														assessment.materials.length > 0 && (
															<Box>
																<Text size='sm' fw={500} mb='xs'>
																	Attachments
																</Text>
																<Stack gap='xs'>
																	{assessment.materials.map(
																		(material, index) => (
																			<Card key={index} withBorder padding='xs'>
																				<Text size='sm'>
																					{material.driveFile?.driveFile
																						?.title ||
																						material.link?.title ||
																						material.youtubeVideo?.title ||
																						material.form?.title ||
																						'Attachment'}
																				</Text>
																			</Card>
																		)
																	)}
																</Stack>
															</Box>
														)}

													{assessment.dueDate && (
														<Text size='xs' c='dimmed'>
															Due:{' '}
															{new Date(
																assessment.dueDate.year || 0,
																(assessment.dueDate.month || 1) - 1,
																assessment.dueDate.day || 1
															).toLocaleDateString('en-US', {
																month: 'long',
																day: 'numeric',
																year: 'numeric',
															})}
														</Text>
													)}

													<Group justify='flex-end' mt='sm'>
														<Button
															component={Link}
															href={`/courses/${courseId}/${assessment.id}`}
															size='sm'
															variant='light'
														>
															View Details
														</Button>
													</Group>
												</Stack>
											</Accordion.Panel>
										</Accordion.Item>
									))}
								</Accordion>
							</Box>
						);
					})}
				</Stack>
			)}
		</Stack>
	);
}
