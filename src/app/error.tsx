'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import StatusPage from '@/shared/ui/StatusPage';

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<StatusPage
			title='Something went wrong'
			description='An unexpected error occurred. Please try again.'
			color='red'
			icon={<IconAlertTriangle size={32} />}
			showBack
			onRetry={reset}
		/>
	);
}
