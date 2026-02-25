'use client';

import { BarChart } from '@mantine/charts';
import {
	Badge,
	Grid,
	Group,
	Paper,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import type { OriginSchoolRow } from '../_server/repository';

type Props = {
	data: OriginSchoolRow[];
};

export default function OriginSchools({ data }: Props) {
	const total = data.reduce((sum, row) => sum + row.count, 0);
	const top10 = data.slice(0, 10);

	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Paper withBorder p='md' h='100%'>
					<Stack>
						<Group justify='space-between'>
							<Title order={4}>Top 10 Schools</Title>
							<Badge variant='light' size='lg'>
								{total} applicants
							</Badge>
						</Group>
						<BarChart
							h={350}
							data={top10.map((r) => ({
								name: r.name.length > 25 ? `${r.name.slice(0, 22)}...` : r.name,
								value: r.count,
							}))}
							dataKey='name'
							series={[{ name: 'value', color: 'teal.6', label: 'Applicants' }]}
							tickLine='y'
							orientation='vertical'
						/>
					</Stack>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Paper withBorder p='md' h='100%'>
					<Stack>
						<Title order={4}>All Schools</Title>
						<Table.ScrollContainer minWidth={300} mah={400}>
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>#</Table.Th>
										<Table.Th>School</Table.Th>
										<Table.Th ta='right'>Applicants</Table.Th>
										<Table.Th ta='right'>%</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{data.map((row, i) => (
										<Table.Tr key={row.name}>
											<Table.Td>
												<Text size='sm' c='dimmed'>
													{i + 1}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.name}</Text>
											</Table.Td>
											<Table.Td ta='right'>
												<Text size='sm' fw={500}>
													{row.count}
												</Text>
											</Table.Td>
											<Table.Td ta='right'>
												<Text size='sm' c='dimmed'>
													{((row.count / total) * 100).toFixed(1)}%
												</Text>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Table.ScrollContainer>
					</Stack>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
