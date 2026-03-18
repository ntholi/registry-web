'use client';

import {
	Accordion,
	Badge,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import type { CriterionBreakdownItem } from '../_lib/types';

type Props = {
	data: CriterionBreakdownItem[];
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function CriteriaBreakdown({ data }: Props) {
	if (data.length === 0) return null;

	const bySection = new Map<string, Map<string, CriterionBreakdownItem[]>>();
	for (const item of data) {
		if (!bySection.has(item.section)) {
			bySection.set(item.section, new Map());
		}
		const catMap = bySection.get(item.section)!;
		if (!catMap.has(item.categoryName)) {
			catMap.set(item.categoryName, []);
		}
		catMap.get(item.categoryName)!.push(item);
	}

	return (
		<Paper withBorder p='md'>
			<Title order={5} mb='md'>
				Criteria Analysis
			</Title>
			<Accordion>
				{Array.from(bySection.entries()).map(([section, catMap]) => (
					<Accordion.Item key={section} value={section}>
						<Accordion.Control>
							<Text fw={600} size='sm'>
								{section}
							</Text>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='md'>
								{Array.from(catMap.entries()).map(([category, criteria]) => {
									const catAvg =
										criteria.reduce((s, c) => s + c.avgRating, 0) /
										criteria.length;
									return (
										<Paper key={category} withBorder p='sm' radius='sm'>
											<Group justify='space-between' mb='xs'>
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
											<ScrollArea>
												<Table fz='xs' striped>
													<Table.Thead>
														<Table.Tr>
															<Table.Th>Criterion</Table.Th>
															<Table.Th w={80} ta='center'>
																Avg
															</Table.Th>
															<Table.Th w={70} ta='center'>
																Count
															</Table.Th>
														</Table.Tr>
													</Table.Thead>
													<Table.Tbody>
														{criteria.map((c) => (
															<Table.Tr key={c.criterionId}>
																<Table.Td>{c.criterionText}</Table.Td>
																<Table.Td ta='center'>
																	<Badge
																		color={ratingColor(c.avgRating)}
																		variant='light'
																		size='xs'
																	>
																		{c.avgRating.toFixed(2)}
																	</Badge>
																</Table.Td>
																<Table.Td ta='center'>{c.ratingCount}</Table.Td>
															</Table.Tr>
														))}
													</Table.Tbody>
												</Table>
											</ScrollArea>
										</Paper>
									);
								})}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Paper>
	);
}
