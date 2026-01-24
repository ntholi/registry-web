'use client';

import { Button } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useApplicant } from '../_lib/useApplicant';

type Props = {
	applicantId: string;
};

export default function FinishButton({ applicantId }: Props) {
	const router = useRouter();
	const { completeness } = useApplicant(applicantId);

	if (!completeness.isComplete) return null;

	return (
		<Button
			variant='filled'
			color='green'
			leftSection={<IconCheck size={16} />}
			onClick={() => router.push(`/apply/${applicantId}/review`)}
		>
			Finish
		</Button>
	);
}
