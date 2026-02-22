'use client';

import {
	Accordion,
	Badge,
	Card,
	Group,
	Progress,
	Stack,
	Text,
} from '@mantine/core';
import type { QuestionBreakdownItem } from '../_lib/types';

type Props = {
	data: QuestionBreakdownItem[];
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
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
									<Stack gap='sm'>
										{questions.map((q) => (
											<Card key={q.questionId} withBorder p='sm'>
												<Stack gap='xs'>
													<Group justify='space-between'>
														<Text size='sm' style={{ flex: 1 }}>
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
															<Text size='xs' c='dimmed'>
																{q.responseCount} responses
															</Text>
														</Group>
													</Group>
													<Group gap={4}>
														{q.distribution.map((d) => (
															<Stack
																key={d.rating}
																gap={2}
																align='center'
																style={{ flex: 1 }}
															>
																<Progress
																	value={d.percentage}
																	color={
																		d.rating >= 4
																			? 'green'
																			: d.rating >= 3
																				? 'yellow'
																				: 'red'
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
