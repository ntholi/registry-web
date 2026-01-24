'use client';

import { ActionIcon, Button, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useApplicant } from '../_lib/useApplicant';

type Props = {
	applicantId: string;
	backPath?: string;
	onNext?: () => void;
	nextDisabled?: boolean;
	nextLoading?: boolean;
	hideBack?: boolean;
};

export default function WizardNavigation({
	applicantId,
	backPath,
	onNext,
	nextDisabled,
	nextLoading,
	hideBack,
}: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 48em)');
	const { completeness } = useApplicant(applicantId);

	function handleBack() {
		if (backPath) router.push(backPath);
	}

	function handleFinish() {
		router.push(`/apply/${applicantId}/review`);
	}

	return (
		<Group justify={hideBack ? 'flex-end' : 'space-between'} mt='md'>
			{!hideBack &&
				backPath &&
				(isMobile ? (
					<ActionIcon variant='subtle' onClick={handleBack} size='lg'>
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
				{completeness.isComplete && (
					<Button
						variant='filled'
						color='green'
						leftSection={<IconCheck size={16} />}
						onClick={handleFinish}
					>
						Finish
					</Button>
				)}
			</Group>
		</Group>
	);
}
