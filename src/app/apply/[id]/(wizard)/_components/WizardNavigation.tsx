'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { ActionIcon, Button, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';

type Props = {
	applicationId: string;
	backPath?: string;
	onNext?: () => void;
	nextDisabled?: boolean;
	nextLoading?: boolean;
	hideBack?: boolean;
	submitLabel?: string;
	submitIcon?: React.ReactNode;
	submitColor?: string;
};

export function WizardNavigation({
	applicationId,
	backPath,
	onNext,
	nextDisabled,
	nextLoading,
	hideBack,
	submitLabel,
	submitIcon,
	submitColor,
}: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 48em)', true);
	const { completeness } = useApplicant();

	function handleBack() {
		if (backPath) router.push(`/apply/${applicationId}/${backPath}`);
	}

	function handleFinish() {
		router.push(`/apply/${applicationId}/review`);
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
						color={submitColor}
						leftSection={submitLabel ? submitIcon : undefined}
						rightSection={
							submitLabel ? undefined : <IconArrowRight size={16} />
						}
						onClick={onNext}
						disabled={nextDisabled}
						loading={nextLoading}
					>
						{submitLabel ?? 'Next'}
					</Button>
				)}
			</Group>
		</Group>
	);
}
