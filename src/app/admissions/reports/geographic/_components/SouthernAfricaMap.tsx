'use client';

import { Popover, Stack, Text, useMantineColorScheme } from '@mantine/core';
import { useState } from 'react';
import {
	SOUTHERN_AFRICA_COUNTRIES,
	SOUTHERN_AFRICA_VIEWBOX,
} from '../_lib/mapPaths';
import type { CountryAggregation } from '../_server/repository';

type Props = {
	data: CountryAggregation[];
};

export default function SouthernAfricaMap({ data }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const [hovered, setHovered] = useState<string | null>(null);

	const countMap = new Map(data.map((c) => [c.country, c.count]));
	const maxCount = Math.max(...data.map((c) => c.count), 1);

	function getRadius(cnt: number) {
		return 6 + (cnt / maxCount) * 24;
	}

	return (
		<svg
			viewBox={SOUTHERN_AFRICA_VIEWBOX}
			width='100%'
			height='100%'
			style={{ maxHeight: 500 }}
		>
			{SOUTHERN_AFRICA_COUNTRIES.map((country) => (
				<path
					key={country.name}
					d={country.path}
					fill={
						hovered === country.name
							? isDark
								? 'rgba(77, 171, 247, 0.3)'
								: 'rgba(34, 139, 230, 0.2)'
							: isDark
								? 'rgba(255, 255, 255, 0.08)'
								: 'rgba(0, 0, 0, 0.06)'
					}
					stroke={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}
					strokeWidth={1}
					onMouseEnter={() => setHovered(country.name)}
					onMouseLeave={() => setHovered(null)}
					style={{ cursor: 'pointer' }}
				/>
			))}

			{SOUTHERN_AFRICA_COUNTRIES.map((country) => {
				const cnt = countMap.get(country.name) ?? 0;
				if (cnt === 0) return null;
				const r = getRadius(cnt);
				return (
					<Popover key={`bubble-${country.name}`} position='top' withArrow>
						<Popover.Target>
							<g style={{ cursor: 'pointer' }}>
								<circle
									cx={country.centroid.x}
									cy={country.centroid.y}
									r={r}
									fill={
										isDark
											? 'rgba(77, 171, 247, 0.5)'
											: 'rgba(34, 139, 230, 0.5)'
									}
									stroke={
										isDark
											? 'rgba(77, 171, 247, 0.8)'
											: 'rgba(34, 139, 230, 0.8)'
									}
									strokeWidth={1.5}
								/>
								<text
									x={country.centroid.x}
									y={country.centroid.y + 4}
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
									{country.name}
								</Text>
								<Text size='xs' c='dimmed'>
									{cnt} application{cnt !== 1 ? 's' : ''}
								</Text>
							</Stack>
						</Popover.Dropdown>
					</Popover>
				);
			})}

			{SOUTHERN_AFRICA_COUNTRIES.map((country) => (
				<text
					key={`label-${country.name}`}
					x={country.centroid.x}
					y={
						country.centroid.y -
						(countMap.get(country.name)
							? getRadius(countMap.get(country.name)!) + 8
							: 0)
					}
					textAnchor='middle'
					fontSize={9}
					fill={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}
				>
					{country.name}
				</text>
			))}
		</svg>
	);
}
