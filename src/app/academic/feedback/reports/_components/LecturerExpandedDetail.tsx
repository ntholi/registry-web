'use client';

import {
	Accordion,
	Badge,
	Card,
	Group,
	Loader,
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
import type {
	FeedbackReportFilter,
	LecturerQuestionDetail,
} from '../_lib/types';
import { getFeedbackLecturerDetail } from '../_server/actions';

type Props = {
	userId: string;
	filter: FeedbackReportFilter;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function LecturerExpandedDetail({ userId, filter }: Props) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['feedback-lecturer-detail', userId, filter],
		queryFn: () => getFeedbackLecturerDetail(userId, filter),
	});

	if (isLoading) {
		return (
			<Stack align='center' p='xl'>
				<Loader size='sm' />
				<Text size='sm' c='dimmed'>
					Loading details...
				</Text>
			</Stack>
		);
	}

	if (!detail) {
		return (
			<Text c='dimmed' ta='center' p='md'>
				No data found
			</Text>
		);
	}

	const grouped = new Map<string, LecturerQuestionDetail[]>();
	for (const q of detail.questions) {
		const list = grouped.get(q.categoryName) ?? [];
		list.push(q);
		grouped.set(q.categoryName, list);
	}

	return (
		<Tabs defaultValue='questions'>
			<Tabs.List>
				<Tabs.Tab
					value='questions'
					leftSection={<IconQuestionMark size={14} />}
				>
					Questions
				</Tabs.Tab>
				<Tabs.Tab value='modules' leftSection={<IconBook2 size={14} />}>
					Modules
				</Tabs.Tab>
				<Tabs.Tab
					value='comments'
					leftSection={<IconMessageCircle size={14} />}
				>
					Comments ({detail.comments.length})
				</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='questions' pt='md'>
				{detail.questions.length === 0 ? (
					<Text c='dimmed' ta='center' p='md'>
						No question data
					</Text>
				) : (
					<Accordion variant='contained' chevronPosition='right'>
						{Array.from(grouped.entries()).map(([category, questions]) => {
							const catAvg =
								questions.reduce((sum, q) => sum + q.avgRating, 0) /
								questions.length;
							return (
								<Accordion.Item key={category} value={category}>
									<Accordion.Control>
										<Group justify='space-between' pr='sm'>
											<Text size='sm' fw={500}>
												{category}
											</Text>
											<Group gap='xs'>
												<Text size='xs' c='dimmed'>
													{questions.length} questions
												</Text>
												<Badge
													color={ratingColor(catAvg)}
													variant='light'
													size='sm'
												>
													{catAvg.toFixed(2)}
												</Badge>
											</Group>
										</Group>
									</Accordion.Control>
									<Accordion.Panel>
										<Stack gap='xs'>
											{questions.map((q) => (
												<QuestionCard key={q.questionId} question={q} />
											))}
										</Stack>
									</Accordion.Panel>
								</Accordion.Item>
							);
						})}
					</Accordion>
				)}
			</Tabs.Panel>

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
	);
}

type QuestionCardProps = {
	question: LecturerQuestionDetail;
};

function QuestionCard({ question: q }: QuestionCardProps) {
	const delta = q.avgRating - q.overallAvgRating;
	const deltaColor = delta >= 0 ? 'green' : 'red';

	return (
		<Card withBorder p='sm'>
			<Stack gap='xs'>
				<Group justify='space-between' wrap='nowrap'>
					<Text size='sm' fw={500} style={{ flex: 1 }}>
						{q.questionText}
					</Text>
					<Group gap='xs' wrap='nowrap'>
						<Badge color={ratingColor(q.avgRating)} variant='light' size='sm'>
							{q.avgRating.toFixed(2)}
						</Badge>
						<Text size='xs' c={deltaColor}>
							({delta >= 0 ? '+' : ''}
							{delta.toFixed(2)})
						</Text>
					</Group>
				</Group>
				<Text size='xs' c='dimmed'>
					{q.responseCount} responses · Overall avg:{' '}
					{q.overallAvgRating.toFixed(2)}
				</Text>
				<Group gap={4}>
					{q.distribution.map((d) => (
						<Stack key={d.rating} gap={2} align='center' style={{ flex: 1 }}>
							<Progress
								value={d.percentage}
								color={
									d.rating >= 4 ? 'green' : d.rating >= 3 ? 'yellow' : 'red'
								}
								size='sm'
								w='100%'
							/>
							<Text size='xs' c='dimmed'>
								{d.rating}★ ({d.percentage}%)
							</Text>
						</Stack>
					))}
				</Group>
			</Stack>
		</Card>
	);
}
