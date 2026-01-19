import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
	title: 'Apply - Limkokwing University',
	description:
		'Apply to Limkokwing University of Creative Technology, Lesotho. Start your journey to becoming the most successful.',
	keywords: [
		'Apply',
		'Admissions',
		'Limkokwing University',
		'Limkokwing Lesotho',
		'University Application',
	],
};

export default function ApplyLayout({ children }: PropsWithChildren) {
	return <>{children}</>;
}
