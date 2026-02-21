'use client';

import { Popover, Stack, Text, useMantineColorScheme } from '@mantine/core';
import { LESOTHO_TOWNS } from '../_lib/lesothoTowns';
import { LESOTHO_DISTRICTS, LESOTHO_VIEWBOX } from '../_lib/mapPaths';
import type { DistrictAggregation } from '../_server/repository';

type Props = {
	data: DistrictAggregation[];
};

export default function LesothoMap({ data }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	const countMap = new Map(data.map((d) => [d.district, d.count]));
	const maxCount = Math.max(...data.map((d) => d.count), 1);

	function getRadius(cnt: number) {
		return 6 + (cnt / maxCount) * 20;
	}

	return (
		<svg
			viewBox={LESOTHO_VIEWBOX}
			width='100%'
			height='100%'
			role='img'
			aria-label='Map of Lesotho districts and application counts'
			style={{ maxHeight: 500 }}
		>
			<title>Lesotho districts application map</title>
			{LESOTHO_DISTRICTS.map((district) => (
				<path
					key={district.name}
					d={district.path}
					fill={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
					stroke={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}
					strokeWidth={1}
				/>
			))}

			{LESOTHO_DISTRICTS.map((district) => {
				const cnt = countMap.get(district.name) ?? 0;
				if (cnt === 0) return null;
				const r = getRadius(cnt);
				return (
					<Popover key={`bubble-${district.name}`} position='top' withArrow>
						<Popover.Target>
							<g style={{ cursor: 'pointer' }}>
								<circle
									cx={district.centroid.x}
									cy={district.centroid.y}
									r={r}
									fill={
										isDark
											? 'rgba(56, 178, 172, 0.5)'
											: 'rgba(18, 184, 134, 0.5)'
									}
									stroke={
										isDark
											? 'rgba(56, 178, 172, 0.8)'
											: 'rgba(18, 184, 134, 0.8)'
									}
									strokeWidth={1.5}
								/>
								<text
									x={district.centroid.x}
									y={district.centroid.y + 4}
									textAnchor='middle'
									fontSize={10}
									fill={isDark ? '#fff' : '#000'}
									fontWeight={600}
								>
									{cnt}
								</text>
							</g>
						</Popover.Target>
						<Popover.Dropdown>
							<Stack gap={4}>
								<Text size='sm' fw={600}>
									{district.name}
								</Text>
								<Text size='xs' c='dimmed'>
									{cnt} application{cnt !== 1 ? 's' : ''}
								</Text>
							</Stack>
						</Popover.Dropdown>
					</Popover>
				);
			})}

			{LESOTHO_TOWNS.map((town) => (
				<g key={`town-${town.name}`}>
					<circle
						cx={town.x}
						cy={town.y}
						r={3}
						fill={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'}
					/>
					<text
						x={town.x + 6}
						y={town.y + 3}
						fontSize={7}
						fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
					>
						{town.name}
					</text>
				</g>
			))}

			{LESOTHO_DISTRICTS.map((district) => (
				<text
					key={`label-${district.name}`}
					x={district.centroid.x}
					y={
						district.centroid.y -
						(countMap.get(district.name)
							? getRadius(countMap.get(district.name)!) + 8
							: 0)
					}
					textAnchor='middle'
					fontSize={8}
					fill={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}
				>
					{district.name}
				</text>
			))}
		</svg>
	);
}
