'use client';

import { DonutChart } from '@mantine/charts';
import { Grid, Paper, Stack, Table, Text, Title } from '@mantine/core';
import type { CertificateDistRow } from '../_server/repository';

type Props = {
	data: CertificateDistRow[];
};

const COLORS = [
	'blue.6',
	'teal.6',
	'orange.6',
	'grape.6',
	'cyan.6',
	'pink.6',
	'lime.6',
	'indigo.6',
	'yellow.6',
	'red.6',
];

export default function CertificateChart({ data }: Props) {
	const chartData = data.map((r, i) => ({
		name: r.certificateTypeName,
		value: r.count,
		color: COLORS[i % COLORS.length],
	}));

	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Paper withBorder p='md'>
					<Stack>
						<Title order={4}>Certificate Types</Title>
						{chartData.length > 0 ? (
							<DonutChart
								data={chartData}
								h={300}
								withLabelsLine
								withLabels
								tooltipDataSource='segment'
							/>
						) : (
							<Text c='dimmed' ta='center' py='xl'>
								No data available
							</Text>
						)}
					</Stack>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Paper withBorder p='md'>
					<Stack>
						<Title order={4}>Breakdown</Title>
						<Table striped highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Certificate Type</Table.Th>
									<Table.Th ta='right'>Count</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.map((r) => (
									<Table.Tr key={r.certificateTypeId}>
										<Table.Td>{r.certificateTypeName}</Table.Td>
										<Table.Td ta='right'>{r.count}</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Stack>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
