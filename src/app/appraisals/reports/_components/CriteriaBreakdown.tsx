'use client';

import {
	Accordion,
	Badge,
	Card,
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

type CategoryGroup = {
	categoryId: string;
	categoryName: string;
	avgRating: number;
	ratingCount: number;
	criteria: CriterionBreakdownItem[];
};

type SectionGroup = {
	section: string;
	avgRating: number;
	ratingCount: number;
	criteriaCount: number;
	categories: CategoryGroup[];
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function formatSectionLabel(section: string) {
	return section
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function getAvg(items: CriterionBreakdownItem[]) {
	const total = items.reduce(
		(sum, item) => sum + item.avgRating * item.ratingCount,
		0
	);
	const count = items.reduce((sum, item) => sum + item.ratingCount, 0);
	if (count === 0) return 0;
	return total / count;
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

	const sections: SectionGroup[] = Array.from(bySection.entries())
		.map(([section, catMap]) => {
			const categories: CategoryGroup[] = Array.from(catMap.entries())
				.map(([categoryName, criteria]) => ({
					categoryId: criteria[0]?.categoryId ?? categoryName,
					categoryName,
					avgRating: getAvg(criteria),
					ratingCount: criteria.reduce(
						(sum, item) => sum + item.ratingCount,
						0
					),
					criteria: criteria.toSorted((a, b) =>
						a.criterionText.localeCompare(b.criterionText)
					),
				}))
				.toSorted(
					(a, b) =>
						b.avgRating - a.avgRating ||
						a.categoryName.localeCompare(b.categoryName)
				);

			const allCriteria = categories.flatMap((category) => category.criteria);

			return {
				section,
				avgRating: getAvg(allCriteria),
				ratingCount: allCriteria.reduce(
					(sum, item) => sum + item.ratingCount,
					0
				),
				criteriaCount: allCriteria.length,
				categories,
			};
		})
		.toSorted(
			(a, b) =>
				b.avgRating - a.avgRating ||
				formatSectionLabel(a.section).localeCompare(
					formatSectionLabel(b.section)
				)
		);

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Stack gap={4}>
					<Title order={5}>Criteria Analysis</Title>
					<Text c='dimmed' size='sm'>
						Review each observation section, its category performance, and the
						underlying criterion-level averages.
					</Text>
				</Stack>
				<Accordion chevronPosition='right' radius='md' variant='contained'>
					{sections.map((section) => (
						<Accordion.Item key={section.section} value={section.section}>
							<Accordion.Control>
								<Group justify='space-between' pr='sm' wrap='nowrap'>
									<Stack gap={2}>
										<Text fw={600} size='sm'>
											{formatSectionLabel(section.section)}
										</Text>
										<Text c='dimmed' size='xs'>
											{section.categories.length} categories ·{' '}
											{section.criteriaCount} criteria
										</Text>
									</Stack>
									<Group gap='xs'>
										<Badge color='gray' size='sm' variant='light'>
											{section.ratingCount} ratings
										</Badge>
										<Badge
											color={ratingColor(section.avgRating)}
											size='sm'
											variant='light'
										>
											{section.avgRating.toFixed(2)} avg
										</Badge>
									</Group>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap='md'>
									{section.categories.map((category) => (
										<Paper
											key={category.categoryId}
											p='md'
											radius='md'
											withBorder
										>
											<Stack gap='sm'>
												<Group justify='space-between' wrap='nowrap'>
													<Stack gap={2} style={{ flex: 1 }}>
														<Text size='sm' fw={500}>
															{category.categoryName}
														</Text>
														<Text c='dimmed' size='xs'>
															{category.criteria.length} criteria
														</Text>
													</Stack>
													<Group gap='xs'>
														<Badge color='gray' size='sm' variant='light'>
															{category.ratingCount} ratings
														</Badge>
														<Badge
															color={ratingColor(category.avgRating)}
															size='sm'
															variant='light'
														>
															{category.avgRating.toFixed(2)} avg
														</Badge>
													</Group>
												</Group>
												<ScrollArea.Autosize mah={320}>
													<Table fz='xs' highlightOnHover striped>
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
															{category.criteria.map((c, index) => (
																<Table.Tr key={c.criterionId}>
																	<Table.Td>
																		<Stack gap={2}>
																			<Text c='dimmed' size='xs'>
																				Criterion {index + 1}
																			</Text>
																			<Text size='sm'>{c.criterionText}</Text>
																		</Stack>
																	</Table.Td>
																	<Table.Td ta='center'>
																		<Badge
																			color={ratingColor(c.avgRating)}
																			variant='light'
																			size='xs'
																		>
																			{c.avgRating.toFixed(2)}
																		</Badge>
																	</Table.Td>
																	<Table.Td ta='center'>
																		{c.ratingCount}
																	</Table.Td>
																</Table.Tr>
															))}
														</Table.Tbody>
													</Table>
												</ScrollArea.Autosize>
											</Stack>
										</Paper>
									))}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			</Stack>
		</Card>
	);
}
