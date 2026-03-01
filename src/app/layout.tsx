import '@mantine/core/styles.css';
import './global.css';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Maintenance from './Maintenance';
import Providers from './providers';

export const metadata: Metadata = {
	title: 'Limkokwing Student Portal',
	description:
		'Student Portal for Limkokwing University of Creative Technology, Lesotho',
	keywords: [
		'Limkokwing Student Portal',
		'Student Portal',
		'Limkokwing Lesotho',
	],
	icons: {
		icon: '/images/logo.png',
	},
	openGraph: {
		images: [
			{
				url: '/images/logo.png',
				width: 1371,
				height: 691,
			},
		],
	},
};

export default function RootLayout() {
	return (
		<html lang='en' suppressHydrationWarning>
			<body suppressHydrationWarning>
				<Suspense>
					<Providers>
						<Maintenance />
					</Providers>
				</Suspense>
			</body>
		</html>
	);
}
