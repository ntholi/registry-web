'use client';

import { Button } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useApplicant } from '../../_lib/useApplicant';

export default function ReviewButton() {
	const router = useRouter();
	const { completeness } = useApplicant();

	if (!completeness.isComplete) return null;

	return (
		<Button
			variant='filled'
			color='green'
			leftSection={<IconCheck size={16} />}
			onClick={() => router.push('/apply/wizard/review')}
		>
			Finish
		</Button>
	);
}
