'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { ProgramDemandRow } from '../_server/repository';

type Props = {
	data: ProgramDemandRow[];
};

export default function ProgramRanking({ data }: Props) {
	const top = data.slice(0, 30);
	const chartData = top.map((r) => ({
		programCode: r.programCode,
		programName: r.programName,
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
						h={420}
						data={chartData}
						dataKey='programCode'
						orientation='horizontal'
						series={[{ name: 'Applications', color: 'blue.6' }]}
						gridAxis='x'
						tickLine='x'
						xAxisProps={{
							tick: { fontSize: 10, fill: 'var(--mantine-color-text)' },
						}}
						yAxisProps={{ width: 32 }}
						tooltipProps={{
							labelFormatter: (_, payload) =>
								payload?.[0]?.payload?.programName ?? '',
						}}
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
