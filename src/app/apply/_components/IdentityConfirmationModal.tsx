'use client';

import { Divider, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconId } from '@tabler/icons-react';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';
import { BaseConfirmationModal } from './BaseConfirmationModal';
import { ConfirmationField } from './ConfirmationField';

type Props = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	analysis: IdentityDocumentResult | null;
	loading?: boolean;
};

export function IdentityConfirmationModal({
	opened,
	onClose,
	onConfirm,
	analysis,
	loading,
}: Props) {
	if (!analysis) return null;

	return (
		<BaseConfirmationModal
			opened={opened}
			onClose={onClose}
			onConfirm={onConfirm}
			title='Confirm Identity Document'
			loading={loading}
		>
			<Paper
				p='md'
				radius='md'
				style={{
					background:
						'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
					border: '1px solid var(--mantine-color-dark-4)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<Stack gap='md' pt='xs'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								National ID
							</Text>
							<Text size='xl' fw={700} ff='monospace'>
								{analysis.nationalId || '—'}
							</Text>
						</Stack>
						<ThemeIcon
							variant='light'
							size={50}
							radius='md'
							color='blue'
							opacity={0.8}
						>
							<IconId size={28} />
						</ThemeIcon>
					</Group>

					<Divider color='dark.5' />

					<Text size='lg' fw={700} tt='uppercase' lts={1}>
						{analysis.fullName || '—'}
					</Text>

					<Stack gap='xs'>
						<ConfirmationField
							label='DOB'
							value={analysis.dateOfBirth}
							labelWidth={60}
						/>
						<ConfirmationField
							label='Gender'
							value={analysis.gender}
							labelWidth={60}
						/>
						<ConfirmationField
							label='Nation'
							value={analysis.nationality}
							labelWidth={60}
						/>
						{analysis.birthPlace && (
							<ConfirmationField
								label='Birth'
								value={analysis.birthPlace}
								labelWidth={60}
							/>
						)}
					</Stack>

					{analysis.expiryDate && (
						<>
							<Divider color='dark.5' />
							<Group justify='space-between'>
								<Text size='xs' c='dimmed'>
									Expires
								</Text>
								<Text size='xs' fw={500}>
									{analysis.expiryDate}
								</Text>
							</Group>
						</>
					)}
				</Stack>
			</Paper>
		</BaseConfirmationModal>
	);
}
