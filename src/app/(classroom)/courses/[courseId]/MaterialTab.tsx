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
	materials: CourseWork[];
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

	return (
		<Stack gap='lg'>
			<Group justify='space-between'>
				<Text size='lg' fw={500}>
					Material
				</Text>
				<Button leftSection={<IconPlus size='1rem' />} variant='light'>
					Create
				</Button>
			</Group>

			{materials.length === 0 ? (
				<Card>
					<Text c='dimmed'>No materials yet</Text>
				</Card>
			) : (
				<Stack gap='xl'>
					{sortedTopics.map((topicId) => {
						const topicName =
							topicId === 'no-topic'
								? 'General'
								: topicMap.get(topicId) || 'Topic';
						const topicMaterials = groupedByTopic[topicId];

						return (
							<Box key={topicId}>
								<Group mb='md' gap='sm'>
									<Text size='md' fw={600} c='blue'>
										{topicName}
									</Text>
									<Badge size='sm' variant='light'>
										{topicMaterials.length}
									</Badge>
								</Group>

								<Accordion variant='separated' chevronPosition='right'>
									{topicMaterials.map((material) => (
										<Accordion.Item key={material.id} value={material.id || ''}>
											<Accordion.Control>
												<Group justify='space-between' wrap='nowrap' mr='md'>
													<Box style={{ flex: 1 }}>
														<Text fw={500} size='sm' lineClamp={2}>
															{material.title}
														</Text>
														{material.materials &&
															material.materials.length > 0 && (
																<Group gap='xs' mt='xs'>
																	{material.materials.map((mat, index) => (
																		<Badge
																			key={
																				mat.driveFile?.driveFile?.id ||
																				mat.link?.url ||
																				mat.youtubeVideo?.id ||
																				mat.form?.formUrl ||
																				index
																			}
																			size='xs'
																			variant='outline'
																		>
																			{mat.driveFile?.driveFile?.title ||
																				mat.link?.title ||
																				mat.youtubeVideo?.title ||
																				mat.form?.title ||
																				'Attachment'}
																		</Badge>
																	))}
																</Group>
															)}
													</Box>
													<Text
														size='xs'
														c='dimmed'
														style={{ whiteSpace: 'nowrap' }}
													>
														{formatDate(material.creationTime)}
													</Text>
												</Group>
											</Accordion.Control>
											<Accordion.Panel>
												<Stack gap='sm'>
													{material.description && (
														<Text size='sm' c='dimmed'>
															{material.description}
														</Text>
													)}

													{material.materials &&
														material.materials.length > 0 && (
															<Box>
																<Text size='sm' fw={500} mb='xs'>
																	Attachments
																</Text>
																<Stack gap='xs'>
																	{material.materials.map((mat, index) => (
																		<Card key={index} withBorder padding='xs'>
																			<Group justify='space-between'>
																				<Text size='sm'>
																					{mat.driveFile?.driveFile?.title ||
																						mat.link?.title ||
																						mat.youtubeVideo?.title ||
																						mat.form?.title ||
																						'Attachment'}
																				</Text>
																				{mat.link?.url && (
																					<Text
																						size='xs'
																						component='a'
																						href={mat.link.url}
																						target='_blank'
																						c='blue'
																					>
																						Open
																					</Text>
																				)}
																			</Group>
																		</Card>
																	))}
																</Stack>
															</Box>
														)}

													<Group justify='flex-end' mt='sm'>
														<Button
															component={Link}
															href={`/courses/${courseId}/${material.id}`}
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
