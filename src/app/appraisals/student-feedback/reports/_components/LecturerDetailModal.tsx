'use client';

import { BarChart } from '@mantine/charts';
import {
	Accordion,
	Badge,
	Card,
	Group,
	Loader,
	Modal,
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
	userId: string | null;
	filter: StudentFeedbackReportFilter;
	onClose: () => void;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function truncate(text: string, max: number) {
	return text.length > max ? `${text.substring(0, max)}…` : text;
}

export default function LecturerDetailModal({
	userId,
	filter,
	onClose,
}: Props) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['student-feedback-lecturer-detail', userId, filter],
		queryFn: () => getStudentFeedbackLecturerDetail(userId!, filter),
		enabled: Boolean(userId),
	});

	const grouped = new Map<string, LecturerQuestionDetail[]>();
	if (detail) {
		for (const q of detail.questions) {
			const list = grouped.get(q.categoryName) ?? [];
			list.push(q);
			grouped.set(q.categoryName, list);
		}
	}

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
							<Accordion variant='contained' chevronPosition='right'>
								{Array.from(grouped.entries()).map(([category, questions]) => {
									const catAvg =
										questions.reduce((sum, q) => sum + q.avgRating, 0) /
										questions.length;

									const chartData = questions.map((q) => ({
										question: truncate(q.questionText, 28),
										Lecturer: Number(q.avgRating.toFixed(2)),
										Overall: Number(q.overallAvgRating.toFixed(2)),
									}));

									return (
										<Accordion.Item key={category} value={category}>
											<Accordion.Control>
												<Group justify='space-between' pr='sm'>
													<Text size='sm' fw={500}>
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
											</Accordion.Control>
											<Accordion.Panel>
												<BarChart
													h={questions.length * 50 + 50}
													data={chartData}
													dataKey='question'
													orientation='vertical'
													yAxisProps={{ width: 180 }}
													series={[
														{ name: 'Lecturer', color: 'blue.6' },
														{ name: 'Overall', color: 'gray.4' },
													]}
													withLegend
													legendProps={{
														verticalAlign: 'bottom',
														height: 40,
													}}
													tooltipAnimationDuration={200}
													barProps={{ radius: 4 }}
													valueFormatter={(v) => v.toFixed(2)}
												/>
											</Accordion.Panel>
										</Accordion.Item>
									);
								})}
							</Accordion>
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
