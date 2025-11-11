'use client';

import { Box } from '@mantine/core';

export function DebugRibbon() {
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
					backgroundColor: 'rgba(255, 0, 0, 0.7)',
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
