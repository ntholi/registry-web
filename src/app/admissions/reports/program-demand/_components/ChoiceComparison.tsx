'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { ProgramDemandRow } from '../_server/repository';

type Props = {
	data: ProgramDemandRow[];
};

export default function ChoiceComparison({ data }: Props) {
	const top = data.slice(0, 30);
	const chartData = top.map((r) => ({
		programCode: r.programCode,
		programName: r.programName,
		'1st Choice': r.firstChoice,
		'2nd Choice': r.secondChoice,
	}));

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Title order={4}>First vs Second Choice</Title>
				<Text c='dimmed' size='sm'>
					Comparison of first-choice and second-choice selections per program
				</Text>
				{chartData.length > 0 ? (
					<BarChart
						h={420}
						data={chartData}
						dataKey='programCode'
						orientation='horizontal'
						series={[
							{ name: '1st Choice', color: 'blue.6' },
							{ name: '2nd Choice', color: 'cyan.6' },
						]}
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
