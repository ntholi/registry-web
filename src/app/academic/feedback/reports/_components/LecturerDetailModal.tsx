'use client';

import {
	Badge,
	Card,
	Group,
	Loader,
	Modal,
	Progress,
	ScrollArea,
	Stack,
	Table,
	Tabs,
	Text,
} from '@mantine/core';
import {
	IconBook2,
	IconMessageCircle,
	IconQuestionMark,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { FeedbackReportFilter } from '../_lib/types';
import { getFeedbackLecturerDetail } from '../_server/actions';

type Props = {
	userId: string | null;
	filter: FeedbackReportFilter;
	onClose: () => void;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function LecturerDetailModal({
	userId,
	filter,
	onClose,
}: Props) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['feedback-lecturer-detail', userId, filter],
		queryFn: () => getFeedbackLecturerDetail(userId!, filter),
		enabled: Boolean(userId),
	});

	return (
		<Modal
			opened={Boolean(userId)}
			onClose={onClose}
			size='xl'
			title={
				detail ? (
					<Group gap='sm'>
						<Text fw={600}>{detail.lecturerName}</Text>
						<Badge color='gray' variant='light'>
							{detail.schoolCode}
						</Badge>
						<Badge color={ratingColor(detail.avgRating)} variant='light'>
							{detail.avgRating.toFixed(2)} / 5
						</Badge>
					</Group>
				) : (
					'Lecturer Detail'
				)
			}
		>
			{isLoading && (
				<Stack align='center' p='xl'>
					<Loader />
				</Stack>
			)}

			{!isLoading && !detail && (
				<Text c='dimmed' ta='center' p='xl'>
					No data found
				</Text>
			)}

			{!isLoading && detail && (
				<Tabs defaultValue='modules'>
					<Tabs.List>
						<Tabs.Tab value='modules' leftSection={<IconBook2 size={14} />}>
							Modules
						</Tabs.Tab>
						<Tabs.Tab
							value='questions'
							leftSection={<IconQuestionMark size={14} />}
						>
							Questions
						</Tabs.Tab>
						<Tabs.Tab
							value='comments'
							leftSection={<IconMessageCircle size={14} />}
						>
							Comments ({detail.comments.length})
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='modules' pt='md'>
						<ScrollArea>
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Module Code</Table.Th>
										<Table.Th>Module Name</Table.Th>
										<Table.Th>Avg Rating</Table.Th>
										<Table.Th>Responses</Table.Th>
										<Table.Th>Class</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{detail.modules.map((m) => (
										<Table.Tr key={`${m.moduleCode}-${m.className}`}>
											<Table.Td>{m.moduleCode}</Table.Td>
											<Table.Td>{m.moduleName}</Table.Td>
											<Table.Td>
												<Badge color={ratingColor(m.avgRating)} variant='light'>
													{m.avgRating.toFixed(2)}
												</Badge>
											</Table.Td>
											<Table.Td>{m.responseCount}</Table.Td>
											<Table.Td>{m.className}</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</ScrollArea>
					</Tabs.Panel>

					<Tabs.Panel value='questions' pt='md'>
						<ScrollArea>
							<Stack gap='sm'>
								{detail.questions.map((q) => {
									const delta = q.avgRating - q.overallAvgRating;
									const deltaColor = delta >= 0 ? 'green' : 'red';
									return (
										<Card key={q.questionId} withBorder p='sm'>
											<Stack gap='xs'>
												<Group justify='space-between'>
													<Text size='sm' fw={500} style={{ flex: 1 }}>
														{q.questionText}
													</Text>
													<Group gap='xs'>
														<Badge
															color={ratingColor(q.avgRating)}
															variant='light'
															size='sm'
														>
															{q.avgRating.toFixed(2)}
														</Badge>
														<Text size='xs' c={deltaColor}>
															({delta >= 0 ? '+' : ''}
															{delta.toFixed(2)})
														</Text>
													</Group>
												</Group>
												<Text size='xs' c='dimmed'>
													{q.categoryName} · {q.responseCount} responses
												</Text>
												<Group gap={4}>
													{q.distribution.map((d) => (
														<Progress
															key={d.rating}
															value={d.percentage}
															color={
																d.rating >= 4
																	? 'green'
																	: d.rating >= 3
																		? 'yellow'
																		: 'red'
															}
															size='sm'
															style={{ flex: 1 }}
														/>
													))}
												</Group>
											</Stack>
										</Card>
									);
								})}
							</Stack>
						</ScrollArea>
					</Tabs.Panel>

					<Tabs.Panel value='comments' pt='md'>
						<ScrollArea mah={400}>
							<Stack gap='sm'>
								{detail.comments.length === 0 && (
									<Text c='dimmed' ta='center' p='md'>
										No comments
									</Text>
								)}
								{detail.comments.map((c, idx) => (
									<Card
										key={`${c.moduleCode}-${c.className}-${idx}`}
										withBorder
										p='sm'
									>
										<Group justify='space-between' mb={4}>
											<Text size='xs' fw={500}>
												{c.moduleCode} — {c.moduleName}
											</Text>
											<Badge size='xs' variant='light' color='gray'>
												{c.className}
											</Badge>
										</Group>
										<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
											{c.comment}
										</Text>
									</Card>
								))}
							</Stack>
						</ScrollArea>
					</Tabs.Panel>
				</Tabs>
			)}
		</Modal>
	);
}
