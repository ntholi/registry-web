'use client';

import { RadarChart as MantineRadarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { RadarDataPoint } from '../_lib/types';

type Props = {
	data: RadarDataPoint[];
	compact?: boolean;
};

export default function RadarChart({ data, compact }: Props) {
	if (data.length === 0) {
		return (
			<Text c='dimmed' ta='center' p='md' size='sm'>
				No radar data available
			</Text>
		);
	}

	const hasFeedback = data.some((d) => d.feedbackScore > 0);
	const hasObservation = data.some((d) => d.observationScore > 0);

	const series = [
		...(hasFeedback
			? [{ name: 'feedbackScore' as const, color: 'blue', opacity: 0.2 }]
			: []),
		...(hasObservation
			? [{ name: 'observationScore' as const, color: 'teal', opacity: 0.2 }]
			: []),
	];

	const chartData = data.map((d) => ({
		category: abbreviateCategory(d.category),
		feedbackScore: d.feedbackScore,
		observationScore: d.observationScore,
	}));

	if (compact) {
		return (
			<MantineRadarChart
				h={250}
				data={chartData}
				dataKey='category'
				series={series}
				withPolarRadiusAxis
				withLegend
			/>
		);
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Text fw={600} size='sm'>
					Feedback vs Observation
				</Text>
				<MantineRadarChart
					h={300}
					data={chartData}
					dataKey='category'
					series={series}
					withPolarRadiusAxis
					withLegend
				/>
			</Stack>
		</Paper>
	);
}

function abbreviateCategory(name: string): string {
	if (name.length <= 15) return name;
	const ampIdx = name.indexOf('&');
	if (ampIdx > 0) return name.substring(0, ampIdx).trim();
	return `${name.substring(0, 14)}…`;
}
