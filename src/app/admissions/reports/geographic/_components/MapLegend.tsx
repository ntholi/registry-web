'use client';

import { Flex, Stack, Text, useMantineColorScheme } from '@mantine/core';

type Props = {
	maxCount: number;
};

export default function MapLegend({ maxCount }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const sizes = [
		{ label: '1', radius: 6 },
		{ label: Math.round(maxCount * 0.25).toString(), radius: 12 },
		{ label: Math.round(maxCount * 0.5).toString(), radius: 18 },
		{ label: maxCount.toString(), radius: 24 },
	];

	return (
		<Stack gap='xs'>
			<Text size='xs' fw={600}>
				Applications
			</Text>
			<Flex gap='md' align='end'>
				{sizes.map((s) => (
					<Stack key={s.label} gap={4} align='center'>
						<svg
							width={s.radius * 2 + 4}
							height={s.radius * 2 + 4}
							role='img'
							aria-label={`Legend bubble for ${s.label} applications`}
						>
							<title>{`Legend bubble for ${s.label} applications`}</title>
							<circle
								cx={s.radius + 2}
								cy={s.radius + 2}
								r={s.radius}
								fill={
									isDark ? 'rgba(77, 171, 247, 0.5)' : 'rgba(34, 139, 230, 0.5)'
								}
								stroke={
									isDark ? 'rgba(77, 171, 247, 0.8)' : 'rgba(34, 139, 230, 0.8)'
								}
								strokeWidth={1.5}
							/>
						</svg>
						<Text size='xs' c='dimmed'>
							{s.label}
						</Text>
					</Stack>
				))}
			</Flex>
		</Stack>
	);
}
