'use client';

import {
	Accordion,
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
	IconChartRadar,
	IconClipboardCheck,
	IconListDetails,
	IconMessageDots,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { LecturerQuestionDetail, ReportFilter } from '../_lib/types';
import { getObservationLecturerDetail } from '../_server/actions';
import RadarChart from './RadarChart';

type Props = {
	userId: string;
	filter: ReportFilter;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function ratingPercent(avg: number) {
	return (avg / 5) * 100;
}

export default function ObservationLecturerDetail({ userId, filter }: Props) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['appraisal-observation-lecturer-detail', userId, filter],
		queryFn: () => getObservationLecturerDetail(userId, filter),
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

	return (
		<Tabs defaultValue='overview'>
			<Tabs.List>
				<Tabs.Tab value='overview' leftSection={<IconChartRadar size={14} />}>
					Overview
				</Tabs.Tab>
				<Tabs.Tab
					value='observations'
					leftSection={<IconClipboardCheck size={14} />}
				>
					Observations
				</Tabs.Tab>
				<Tabs.Tab value='criteria' leftSection={<IconListDetails size={14} />}>
					Criteria
				</Tabs.Tab>
				<Tabs.Tab
					value='feedback-crossref'
					leftSection={<IconMessageDots size={14} />}
				>
					Feedback Cross-ref
				</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='overview' pt='md'>
				<Grid>
					<Grid.Col span={{ base: 12, md: 7 }}>
						<RadarChart data={detail.radarData} compact />
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack gap='sm'>
							<Badge
								size='lg'
								variant='light'
								color={ratingColor(detail.avgScore)}
							>
								Avg: {detail.avgScore.toFixed(2)}
							</Badge>
							<Text size='sm' c='dimmed'>
								{detail.observations.length} observation(s)
							</Text>
							<Text size='sm' c='dimmed'>
								{
									detail.observations.filter((o) => o.status === 'acknowledged')
										.length
								}{' '}
								acknowledged
							</Text>
						</Stack>
					</Grid.Col>
				</Grid>
			</Tabs.Panel>

			<Tabs.Panel value='observations' pt='md'>
				{detail.observations.length === 0 ? (
					<Text c='dimmed' ta='center' p='md'>
						No observations
					</Text>
				) : (
					<Accordion>
						{detail.observations.map((obs) => (
							<Accordion.Item key={obs.observationId} value={obs.observationId}>
								<Accordion.Control>
									<Group justify='space-between' wrap='nowrap' pr='sm'>
										<Group gap='xs'>
											<Text size='sm' fw={500}>
												{obs.moduleCode} — {obs.moduleName}
											</Text>
											<Badge size='xs' variant='light' color='gray'>
												{obs.cycleName}
											</Badge>
										</Group>
										<Group gap='xs'>
											<Badge
												size='xs'
												variant='light'
												color={obs.status === 'acknowledged' ? 'green' : 'blue'}
											>
												{obs.status}
											</Badge>
											<Badge
												size='xs'
												variant='light'
												color={ratingColor(obs.avgScore)}
											>
												{obs.avgScore.toFixed(2)}
											</Badge>
										</Group>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap='sm'>
										{obs.strengths && (
											<Box>
												<Text size='xs' fw={600} c='dimmed'>
													Strengths
												</Text>
												<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
													{obs.strengths}
												</Text>
											</Box>
										)}
										{obs.improvements && (
											<Box>
												<Text size='xs' fw={600} c='dimmed'>
													Areas for Improvement
												</Text>
												<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
													{obs.improvements}
												</Text>
											</Box>
										)}
										{obs.recommendations && (
											<Box>
												<Text size='xs' fw={600} c='dimmed'>
													Recommendations
												</Text>
												<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
													{obs.recommendations}
												</Text>
											</Box>
										)}
										{obs.trainingArea && (
											<Box>
												<Text size='xs' fw={600} c='dimmed'>
													Training Area
												</Text>
												<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
													{obs.trainingArea}
												</Text>
											</Box>
										)}
										{!obs.strengths &&
											!obs.improvements &&
											!obs.recommendations &&
											!obs.trainingArea && (
												<Text size='sm' c='dimmed'>
													No qualitative data recorded
												</Text>
											)}
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						))}
					</Accordion>
				)}
			</Tabs.Panel>

			<Tabs.Panel value='criteria' pt='md'>
				<CriteriaTab scores={detail.criteriaScores} />
			</Tabs.Panel>

			<Tabs.Panel value='feedback-crossref' pt='md'>
				<FeedbackCrossRefTab crossRef={detail.feedbackCrossRef} />
			</Tabs.Panel>
		</Tabs>
	);
}

type CriteriaTabProps = {
	scores: NonNullable<
		Awaited<ReturnType<typeof getObservationLecturerDetail>>
	>['criteriaScores'];
};

function CriteriaTab({ scores }: CriteriaTabProps) {
	if (scores.length === 0) {
		return (
			<Text c='dimmed' ta='center' p='md'>
				No criteria data
			</Text>
		);
	}

	const grouped = new Map<string, Map<string, typeof scores>>();
	for (const s of scores) {
		if (!grouped.has(s.section)) {
			grouped.set(s.section, new Map());
		}
		const sectionMap = grouped.get(s.section)!;
		if (!sectionMap.has(s.categoryName)) {
			sectionMap.set(s.categoryName, []);
		}
		sectionMap.get(s.categoryName)!.push(s);
	}

	return (
		<ScrollArea>
			<Table fz='sm' striped>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Section</Table.Th>
						<Table.Th>Category</Table.Th>
						<Table.Th>Criterion</Table.Th>
						<Table.Th>Avg Rating</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{Array.from(grouped.entries()).map(([section, catMap]) =>
						Array.from(catMap.entries()).map(([category, criteria]) =>
							criteria.map((c, idx) => (
								<Table.Tr key={c.criterionId}>
									{idx === 0 && (
										<Table.Td
											rowSpan={Array.from(catMap.values()).flat().length}
											style={{
												display:
													category === Array.from(catMap.keys())[0] && idx === 0
														? undefined
														: 'none',
											}}
										>
											{section}
										</Table.Td>
									)}
									{idx === 0 && (
										<Table.Td rowSpan={criteria.length}>{category}</Table.Td>
									)}
									<Table.Td>{c.criterionText}</Table.Td>
									<Table.Td>
										<Badge
											color={ratingColor(c.avgRating)}
											variant='light'
											size='sm'
										>
											{c.avgRating.toFixed(2)}
										</Badge>
									</Table.Td>
								</Table.Tr>
							))
						)
					)}
				</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}

type FeedbackCrossRefTabProps = {
	crossRef: NonNullable<
		Awaited<ReturnType<typeof getObservationLecturerDetail>>
	>['feedbackCrossRef'];
};

function FeedbackCrossRefTab({ crossRef }: FeedbackCrossRefTabProps) {
	const { modules, questions, comments } = crossRef;
	const hasData =
		modules.length > 0 || questions.length > 0 || comments.length > 0;

	if (!hasData) {
		return (
			<Text c='dimmed' ta='center' p='md'>
				No student feedback data available
			</Text>
		);
	}

	const grouped = new Map<string, LecturerQuestionDetail[]>();
	for (const q of questions) {
		const list = grouped.get(q.categoryName) ?? [];
		list.push(q);
		grouped.set(q.categoryName, list);
	}

	return (
		<Stack gap='lg'>
			{modules.length > 0 && (
				<Box>
					<Text fw={600} size='sm' mb='xs'>
						Modules
					</Text>
					<ScrollArea>
						<Table striped fz='sm'>
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
								{modules.map((m) => (
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
				</Box>
			)}

			{questions.length > 0 && (
				<Box>
					<Text fw={600} size='sm' mb='xs'>
						Question Breakdown
					</Text>
					<Stack gap='md'>
						{Array.from(grouped.entries()).map(([category, qs]) => {
							const catAvg =
								qs.reduce((sum, q) => sum + q.avgRating, 0) / qs.length;
							return (
								<Box key={category}>
									<Group justify='space-between' mb='xs'>
										<Text size='xs' fw={600}>
											{category}
										</Text>
										<Badge
											color={ratingColor(catAvg)}
											variant='light'
											size='xs'
										>
											{catAvg.toFixed(2)}
										</Badge>
									</Group>
									<Stack gap={4}>
										{qs.map((q) => (
											<CrossRefQuestionRow key={q.questionId} question={q} />
										))}
									</Stack>
								</Box>
							);
						})}
					</Stack>
				</Box>
			)}

			{comments.length > 0 && (
				<Box>
					<Text fw={600} size='sm' mb='xs'>
						Comments ({comments.length})
					</Text>
					<ScrollArea mah={300}>
						<Stack gap='sm'>
							{comments.map((c, idx) => (
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
				</Box>
			)}
		</Stack>
	);
}

type CrossRefQuestionRowProps = {
	question: LecturerQuestionDetail;
};

function CrossRefQuestionRow({ question }: CrossRefQuestionRowProps) {
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
