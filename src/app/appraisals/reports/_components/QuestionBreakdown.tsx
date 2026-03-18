'use client';

import { BarChart } from '@mantine/charts';
import {
	Accordion,
	Badge,
	Card,
	Group,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import type { QuestionBreakdownItem } from '../_lib/types';

type Props = {
	data: QuestionBreakdownItem[];
};

const ratingSeries = [
	{ name: '1★', label: '1 Star', color: 'red.6' },
	{ name: '2★', label: '2 Stars', color: 'orange.5' },
	{ name: '3★', label: '3 Stars', color: 'yellow.5' },
	{ name: '4★', label: '4 Stars', color: 'teal.5' },
	{ name: '5★', label: '5 Stars', color: 'green.6' },
];

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function getDistPct(item: QuestionBreakdownItem, rating: number) {
	if (item.responseCount === 0) return 0;
	const cnt =
		item.distribution.find((entry) => entry.rating === rating)?.count ?? 0;
	return (cnt / item.responseCount) * 100;
}

function getChartRow(item: QuestionBreakdownItem) {
	return {
		label: 'Responses',
		'1★': getDistPct(item, 1),
		'2★': getDistPct(item, 2),
		'3★': getDistPct(item, 3),
		'4★': getDistPct(item, 4),
		'5★': getDistPct(item, 5),
	};
}

function getBarRadius(name: string): [number, number, number, number] | number {
	if (name === '1★') return [8, 0, 0, 8];
	if (name === '5★') return [0, 8, 8, 0];
	return 0;
}

function formatPct(value: number) {
	return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

export default function QuestionBreakdown({ data }: Props) {
	if (data.length === 0) return null;

	const grouped = new Map<
		string,
		{
			categoryName: string;
			categorySortOrder: number;
			questions: QuestionBreakdownItem[];
		}
	>();
	for (const q of data) {
		const current = grouped.get(q.categoryId);
		if (current) {
			current.questions.push(q);
			continue;
		}
		grouped.set(q.categoryId, {
			categoryName: q.categoryName,
			categorySortOrder: q.categorySortOrder,
			questions: [q],
		});
	}

	const categories = Array.from(grouped.entries())
		.map(([categoryId, item]) => ({
			categoryId,
			categoryName: item.categoryName,
			categorySortOrder: item.categorySortOrder,
			questions: item.questions.toSorted(
				(a, b) =>
					a.questionSortOrder - b.questionSortOrder ||
					a.questionText.localeCompare(b.questionText)
			),
		}))
		.toSorted(
			(a, b) =>
				a.categorySortOrder - b.categorySortOrder ||
				a.categoryName.localeCompare(b.categoryName)
		);

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Stack gap={4}>
					<Text fw={600}>Per-Question Breakdown</Text>
					<Text c='dimmed' size='sm'>
						Each question shows the full response mix from 1 to 5 stars.
					</Text>
				</Stack>
				<Accordion chevronPosition='right' radius='md' variant='contained'>
					{categories.map(({ categoryId, categoryName, questions }) => {
						const catAvg =
							questions.reduce((sum, q) => sum + q.avgRating, 0) /
							questions.length;
						const totalResponses = questions.reduce(
							(sum, q) => sum + q.responseCount,
							0
						);

						return (
							<Accordion.Item key={categoryId} value={categoryId}>
								<Accordion.Control>
									<Group justify='space-between' pr='sm' wrap='nowrap'>
										<Stack gap={2}>
											<Text fw={500}>{categoryName}</Text>
											<Text c='dimmed' size='xs'>
												{questions.length} questions
											</Text>
										</Stack>
										<Group gap='xs'>
											<Badge color='gray' variant='light' size='sm'>
												{totalResponses} responses
											</Badge>
											<Badge
												color={ratingColor(catAvg)}
												variant='light'
												size='sm'
											>
												{catAvg.toFixed(2)} avg
											</Badge>
										</Group>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap='sm'>
										<Group gap='xs'>
											{ratingSeries.map((series) => (
												<Badge
													key={series.name}
													color={series.color}
													size='sm'
													variant='dot'
												>
													{series.label}
												</Badge>
											))}
										</Group>

										{questions.map((question, index) => (
											<Paper
												key={question.questionId}
												p='md'
												radius='md'
												withBorder
											>
												<Stack gap='sm'>
													<Group
														align='flex-start'
														justify='space-between'
														wrap='nowrap'
													>
														<Stack gap={2} style={{ flex: 1 }}>
															<Text c='dimmed' size='xs'>
																Question {index + 1}
															</Text>
															<Text fw={500}>{question.questionText}</Text>
														</Stack>
														<Group gap='xs'>
															<Badge color='gray' size='sm' variant='light'>
																{question.responseCount} responses
															</Badge>
															<Badge
																color={ratingColor(question.avgRating)}
																size='sm'
																variant='light'
															>
																{question.avgRating.toFixed(2)} / 5
															</Badge>
														</Group>
													</Group>

													<BarChart
														h={84}
														barProps={(series) => ({
															radius: getBarRadius(series.name),
															stroke: 'var(--mantine-color-body)',
															strokeWidth: 2,
														})}
														data={[getChartRow(question)]}
														dataKey='label'
														gridAxis='x'
														maxBarWidth={18}
														minBarSize={6}
														orientation='vertical'
														series={ratingSeries}
														strokeDasharray='6 6'
														tickLine='none'
														tooltipAnimationDuration={200}
														type='stacked'
														valueFormatter={formatPct}
														withLegend={false}
														withYAxis={false}
														xAxisProps={{
															allowDecimals: false,
															domain: [0, 100],
															tickCount: 5,
															tickMargin: 10,
															type: 'number',
														}}
														yAxisProps={{ width: 0 }}
													/>
												</Stack>
											</Paper>
										))}
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>
			</Stack>
		</Card>
	);
}
