'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { ActionIcon, Button, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';

type Props = {
	backPath?: string;
	onNext?: () => void;
	nextDisabled?: boolean;
	nextLoading?: boolean;
	hideBack?: boolean;
};

export default function WizardNavigation({
	backPath,
	onNext,
	nextDisabled,
	nextLoading,
	hideBack,
}: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 48em)');
	const { completeness } = useApplicant();

	function handleBack() {
		if (backPath) router.push(backPath);
	}

	function handleFinish() {
		router.push('/apply/wizard/review');
	}

	return (
		<Group justify={hideBack ? 'flex-end' : 'space-between'} mt='md'>
			{!hideBack &&
				backPath &&
				(isMobile ? (
					<ActionIcon variant='light' onClick={handleBack} size='lg'>
						<IconArrowLeft size={20} />
					</ActionIcon>
				) : (
					<Button
						variant='subtle'
						leftSection={<IconArrowLeft size={16} />}
						onClick={handleBack}
					>
						Back
					</Button>
				))}
			<Group>
				{completeness.isComplete && (
					<Button
						variant='light'
						color='green'
						leftSection={<IconCheck size={16} />}
						onClick={handleFinish}
					>
						Finish
					</Button>
				)}
				{onNext && (
					<Button
						rightSection={<IconArrowRight size={16} />}
						onClick={onNext}
						disabled={nextDisabled}
						loading={nextLoading}
					>
						Next
					</Button>
				)}
			</Group>
		</Group>
	);
}
