'use client';

import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ApplicationProvider } from './_lib/ApplicationContext';

export default function ApplicationLayout({ children }: PropsWithChildren) {
	const params = useParams<{ id: string }>();
	const applicationId = params.id;

	return (
		<ApplicationProvider applicationId={applicationId}>
			{children}
		</ApplicationProvider>
	);
}
