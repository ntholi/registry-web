'use client';

import { Box, Paper, Stack, Table, Text, Tooltip } from '@mantine/core';
import type { HeatmapCell } from '../_lib/types';

type Props = {
	title: string;
	data: HeatmapCell[];
};

function cellColor(avg: number): string {
	if (avg >= 4) return 'var(--mantine-color-green-6)';
	if (avg >= 3.5) return 'var(--mantine-color-green-4)';
	if (avg >= 3) return 'var(--mantine-color-yellow-5)';
	if (avg >= 2.5) return 'var(--mantine-color-orange-5)';
	return 'var(--mantine-color-red-6)';
}

export default function MatrixHeatmap({ title, data }: Props) {
	if (data.length === 0) return null;

	const schools = [
		...new Map(data.map((c) => [c.schoolId, c.schoolCode])).entries(),
	].map(([id, code]) => ({ id, code }));
	const categories = [
		...new Map(data.map((c) => [c.categoryId, c.categoryName])).entries(),
	].map(([id, name]) => ({ id, name }));

	const lookup = new Map(
		data.map((c) => [`${c.schoolId}-${c.categoryId}`, c.avgRating])
	);

	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>{title}</Text>
				<Table.ScrollContainer minWidth={400}>
					<Table withColumnBorders withTableBorder fz='xs'>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>School</Table.Th>
								{categories.map((cat) => (
									<Table.Th key={cat.id} ta='center'>
										{cat.name}
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{schools.map((school) => (
								<Table.Tr key={school.id}>
									<Table.Td fw={500}>{school.code}</Table.Td>
									{categories.map((cat) => {
										const avg = lookup.get(`${school.id}-${cat.id}`);
										return (
											<Table.Td key={cat.id} p={0}>
												{avg != null ? (
													<Tooltip
														label={`${school.code} × ${cat.name}: ${avg.toFixed(2)}`}
													>
														<Box
															ta='center'
															p='xs'
															style={{
																backgroundColor: cellColor(avg),
																color: 'white',
																fontWeight: 600,
															}}
														>
															{avg.toFixed(1)}
														</Box>
													</Tooltip>
												) : (
													<Box ta='center' p='xs' c='dimmed'>
														—
													</Box>
												)}
											</Table.Td>
										);
									})}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Stack>
		</Paper>
	);
}
