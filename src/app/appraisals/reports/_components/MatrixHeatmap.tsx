'use client';

import {
	Box,
	Paper,
	Popover,
	Stack,
	Table,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';
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

type HeatmapValueCellProps = {
	avg: number;
	label: string;
};

function HeatmapValueCell({ avg, label }: HeatmapValueCellProps) {
	const [opened, setOpened] = useState(false);

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			position='top'
			shadow='md'
			withArrow
		>
			<Popover.Target>
				<UnstyledButton
					bg={cellColor(avg)}
					c='white'
					display='block'
					fw={600}
					onBlur={() => setOpened(false)}
					onFocus={() => setOpened(true)}
					onMouseEnter={() => setOpened(true)}
					onMouseLeave={() => setOpened(false)}
					p='xs'
					ta='center'
					w='100%'
				>
					{avg.toFixed(1)}
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown p='xs'>
				<Text size='xs'>
					{label}: {avg.toFixed(2)}
				</Text>
			</Popover.Dropdown>
		</Popover>
	);
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
													<HeatmapValueCell
														avg={avg}
														label={`${school.code} × ${cat.name}`}
													/>
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
