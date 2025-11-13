'use client';

import { Box } from '@mantine/core';

type Props = {
	isLocal: boolean;
};

export function DebugRibbon({ isLocal }: Props) {
	const backgroundColor = isLocal
		? 'rgba(255, 165, 0, 0.5)'
		: 'rgba(255, 0, 0, 0.7)';

	return (
		<Box
			style={{
				position: 'fixed',
				top: 0,
				right: 0,
				width: '200px',
				height: '200px',
				overflow: 'hidden',
				pointerEvents: 'none',
				zIndex: 9999,
			}}
		>
			<Box
				style={{
					position: 'absolute',
					top: '30px',
					right: '-80px',
					width: '250px',
					transform: 'rotate(45deg)',
					backgroundColor,
					color: 'white',
					textAlign: 'center',
					fontSize: '0.6rem',
					fontWeight: 'bold',
					padding: '6px 0',
					letterSpacing: '1px',
					textTransform: 'uppercase',
				}}
			>
				Debug
			</Box>
		</Box>
	);
}
