'use client';

import {
	Badge,
	Box,
	Card,
	Grid,
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
	LecturerQuestionDetail,
	StudentFeedbackReportFilter,
} from '../_lib/types';
import { getStudentFeedbackLecturerDetail } from '../_server/actions';

type Props = {
	userId: string;
	filter: StudentFeedbackReportFilter;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function ratingPercent(avg: number) {
	return (avg / 5) * 100;
}

export default function LecturerExpandedDetail({ userId, filter }: Props) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['student-feedback-lecturer-detail', userId, filter],
		queryFn: () => getStudentFeedbackLecturerDetail(userId, filter),
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
					<Stack gap='lg'>
						{Array.from(grouped.entries()).map(([category, questions]) => {
							const catAvg =
								questions.reduce((sum, q) => sum + q.avgRating, 0) /
								questions.length;

							return (
								<Box key={category}>
									<Group justify='space-between' mb='xs'>
										<Text size='sm' fw={600}>
											{category}
										</Text>
										<Badge
											color={ratingColor(catAvg)}
											variant='light'
											size='sm'
										>
											{catAvg.toFixed(2)}
										</Badge>
									</Group>
									<Stack gap={6}>
										{questions.map((q) => (
											<QuestionRatingRow key={q.questionId} question={q} />
										))}
									</Stack>
								</Box>
							);
						})}
					</Stack>
				)}
			</Tabs.Panel>

			<Tabs.Panel value='modules' pt='md'>
				<ScrollArea>
					<Table striped highlightOnHover fz='sm'>
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
										<Badge
											color={ratingColor(m.avgRating)}
											variant='light'
											size='sm'
										>
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

type QuestionRatingRowProps = {
	question: LecturerQuestionDetail;
};

function QuestionRatingRow({ question }: QuestionRatingRowProps) {
	const diff = question.avgRating - question.overallAvgRating;
	const diffColor = diff >= 0 ? 'green' : 'red';
	const diffSign = diff >= 0 ? '+' : '';

	return (
		<Card withBorder p='xs' radius='sm'>
			<Grid align='center' gutter='xs'>
				<Grid.Col span={{ base: 12, sm: 5 }}>
					<Text size='xs' lineClamp={2}>
						{question.questionText}
					</Text>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 5 }}>
					<Stack gap={4}>
						<Group gap='xs'>
							<Text size='xs' w={55} c='dimmed'>
								Lecturer
							</Text>
							<Box style={{ flex: 1 }}>
								<Progress
									value={ratingPercent(question.avgRating)}
									color={ratingColor(question.avgRating)}
									size='sm'
									radius='xl'
								/>
							</Box>
							<Text
								size='xs'
								fw={600}
								w={32}
								ta='right'
								c={ratingColor(question.avgRating)}
							>
								{question.avgRating.toFixed(2)}
							</Text>
						</Group>
						<Group gap='xs'>
							<Text size='xs' w={55} c='dimmed'>
								Overall
							</Text>
							<Box style={{ flex: 1 }}>
								<Progress
									value={ratingPercent(question.overallAvgRating)}
									color='gray.5'
									size='sm'
									radius='xl'
								/>
							</Box>
							<Text size='xs' w={32} ta='right' c='dimmed'>
								{question.overallAvgRating.toFixed(2)}
							</Text>
						</Group>
					</Stack>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 2 }}>
					<Group justify='flex-end' gap={4}>
						<Badge size='xs' variant='light' color={diffColor}>
							{diffSign}
							{diff.toFixed(2)}
						</Badge>
						<Text size='xs' c='dimmed'>
							({question.responseCount})
						</Text>
					</Group>
				</Grid.Col>
			</Grid>
		</Card>
	);
}
