'use client';

import { Tooltip, useMantineColorScheme } from '@mantine/core';
import { useState } from 'react';
import { LESOTHO_TOWNS } from '../_lib/lesothoTowns';
import { LESOTHO_DISTRICTS, LESOTHO_VIEWBOX } from '../_lib/mapPaths';
import type { LocationAggregation } from '../_server/repository';

const SCALE_X = 168;
const OFFSET_X = -4485;
const SCALE_Y = -192;
const OFFSET_Y = -5434;

function toSvg(lat: number, lon: number) {
	return {
		x: SCALE_X * lon + OFFSET_X,
		y: SCALE_Y * lat + OFFSET_Y,
	};
}

type Props = {
	data: LocationAggregation[];
};

export default function LesothoMap({ data }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const [hovered, setHovered] = useState<string | null>(null);

	const maxCount = Math.max(...data.map((d) => d.count), 1);

	function getRadius(cnt: number) {
		return 8 + (cnt / maxCount) * 18;
	}

	return (
		<svg
			viewBox={LESOTHO_VIEWBOX}
			width='100%'
			height='100%'
			role='img'
			aria-label='Map of Lesotho locations and application counts'
			style={{ maxHeight: 500 }}
		>
			<title>Lesotho locations application map</title>
			{LESOTHO_DISTRICTS.map((district) => (
				<path
					key={district.name}
					d={district.path}
					fill={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
					stroke={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}
					strokeWidth={1}
				/>
			))}

			{data.map((loc) => {
				const pos = toSvg(loc.latitude, loc.longitude);
				const r = getRadius(loc.count);
				const isHovered = hovered === loc.city;
				return (
					<Tooltip
						key={loc.city}
						label={`${loc.city}: ${loc.count} application${loc.count !== 1 ? 's' : ''}`}
						withArrow
						opened={isHovered}
					>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG group with hover */}
						<g
							aria-label={`${loc.city}: ${loc.count} applications`}
							style={{ cursor: 'pointer' }}
							onMouseEnter={() => setHovered(loc.city)}
							onMouseLeave={() => setHovered(null)}
						>
							<circle
								cx={pos.x}
								cy={pos.y}
								r={r}
								fill={
									isDark ? 'rgba(56, 178, 172, 0.5)' : 'rgba(18, 184, 134, 0.5)'
								}
								stroke={
									isDark ? 'rgba(56, 178, 172, 0.8)' : 'rgba(18, 184, 134, 0.8)'
								}
								strokeWidth={1.5}
								opacity={isHovered ? 0.9 : 0.7}
							/>
							{r >= 10 && (
								<text
									x={pos.x}
									y={pos.y + 4}
									textAnchor='middle'
									fontSize={10}
									fill={isDark ? '#fff' : '#000'}
									fontWeight={600}
								>
									{loc.count}
								</text>
							)}
						</g>
					</Tooltip>
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
					y={district.centroid.y}
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
