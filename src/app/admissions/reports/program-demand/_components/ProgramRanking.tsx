'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { ProgramDemandRow } from '../_server/repository';

type Props = {
	data: ProgramDemandRow[];
};

export default function ProgramRanking({ data }: Props) {
	const top = data.slice(0, 20);
	const chartData = top.map((r) => ({
		program:
			r.programName.length > 30
				? `${r.programName.slice(0, 27)}...`
				: r.programName,
		Applications: r.total,
	}));

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Title order={4}>Top Programs by Total Demand</Title>
				<Text c='dimmed' size='sm'>
					First + second choice applications combined
				</Text>
				{chartData.length > 0 ? (
					<BarChart
						h={Math.max(400, top.length * 35)}
						data={chartData}
						dataKey='program'
						orientation='vertical'
						series={[{ name: 'Applications', color: 'blue.6' }]}
						gridAxis='x'
						tickLine='x'
					/>
				) : (
					<Text c='dimmed' ta='center' py='xl'>
						No data available
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
