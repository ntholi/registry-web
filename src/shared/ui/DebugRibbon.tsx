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
				left: 0,
				width: '100%',
				height: '22px',
				pointerEvents: 'none',
				zIndex: 9999,
			}}
		>
			<Box
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
					width: '100%',
					backgroundColor,
					color: 'white',
					textAlign: 'center',
					fontSize: '0.65rem',
					fontWeight: 'bold',
					letterSpacing: '1px',
					textTransform: 'uppercase',
				}}
			>
				{isLocal ? 'Test/Debug' : '⚠️ Warning!!! ⚠️ Production ⚠️'} Environment
			</Box>
		</Box>
	);
}
