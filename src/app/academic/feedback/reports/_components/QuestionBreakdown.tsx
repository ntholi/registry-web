'use client';

import { BarChart } from '@mantine/charts';
import { Accordion, Badge, Card, Group, Stack, Text } from '@mantine/core';
import type { QuestionBreakdownItem } from '../_lib/types';

type Props = {
	data: QuestionBreakdownItem[];
};

const ratingSeries = [
	{ name: '1★', color: 'red.6' },
	{ name: '2★', color: 'orange.5' },
	{ name: '3★', color: 'yellow.5' },
	{ name: '4★', color: 'teal.5' },
	{ name: '5★', color: 'green.6' },
];

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function truncate(text: string, max: number) {
	return text.length > max ? `${text.substring(0, max)}…` : text;
}

export default function QuestionBreakdown({ data }: Props) {
	if (data.length === 0) return null;

	const grouped = new Map<string, QuestionBreakdownItem[]>();
	for (const q of data) {
		const list = grouped.get(q.categoryName) ?? [];
		list.push(q);
		grouped.set(q.categoryName, list);
	}

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Per-Question Breakdown</Text>
				<Accordion variant='separated'>
					{Array.from(grouped.entries()).map(([category, questions]) => {
						const catAvg =
							questions.reduce((sum, q) => sum + q.avgRating, 0) /
							questions.length;

						const chartData = questions.map((q) => {
							const row: Record<string, string | number> = {
								question: truncate(q.questionText, 35),
							};
							for (let r = 1; r <= 5; r++) {
								const dist = q.distribution.find((d) => d.rating === r);
								row[`${r}★`] = dist?.count ?? 0;
							}
							return row;
						});

						return (
							<Accordion.Item key={category} value={category}>
								<Accordion.Control>
									<Group justify='space-between' pr='sm'>
										<Text fw={500}>{category}</Text>
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
										type='percent'
										orientation='vertical'
										yAxisProps={{ width: 220 }}
										series={ratingSeries}
										withLegend
										legendProps={{
											verticalAlign: 'bottom',
											height: 40,
										}}
										tooltipAnimationDuration={200}
										barProps={{ radius: 4 }}
									/>
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>
			</Stack>
		</Card>
	);
}
