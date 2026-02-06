'use client';

import { Box } from '@mantine/core';
import { Footer } from '../student-portal/_shared';
import ApplyHeader from './_components/ApplyHeader';
import ApplyHero from './_components/ApplyHero';

export default function ApplyPage() {
	return (
		<>
			<Box
				style={{
					minHeight: '95vh',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<ApplyHeader redirectIfRestricted={false} />
				<ApplyHero redirectIfRestricted={false} />
			</Box>
			<Footer />
		</>
	);
}
