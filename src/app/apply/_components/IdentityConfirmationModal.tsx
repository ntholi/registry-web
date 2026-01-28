'use client';

import {
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconId, IconX } from '@tabler/icons-react';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';

type Props = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	analysis: IdentityDocumentResult | null;
	loading?: boolean;
};

function IDField({ label, value }: { label: string; value?: string | null }) {
	return (
		<Group gap={4} wrap='nowrap'>
			<Text size='xs' c='dimmed' fw={600} w={60} tt='uppercase'>
				{label}
			</Text>
			<Text size='sm' fw={500} style={{ flex: 1 }}>
				{value || '—'}
			</Text>
		</Group>
	);
}

export function IdentityConfirmationModal({
	opened,
	onClose,
	onConfirm,
	analysis,
	loading,
}: Props) {
	if (!analysis) return null;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Confirm Identity Document'
			centered
			size='md'
		>
			<Stack gap='lg'>
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
								style={{ opacity: 0.8 }}
							>
								<IconId size={28} />
							</ThemeIcon>
						</Group>

						<Divider color='dark.5' />

						<Text size='lg' fw={700} tt='uppercase' lts={1}>
							{analysis.fullName || '—'}
						</Text>

						<Stack gap='xs'>
							<IDField label='DOB' value={analysis.dateOfBirth} />
							<IDField label='Gender' value={analysis.gender} />
							<IDField label='Nation' value={analysis.nationality} />
							{analysis.birthPlace && (
								<IDField label='Birth' value={analysis.birthPlace} />
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

				<Group justify='flex-end' gap='sm'>
					<Button
						variant='light'
						color='red'
						leftSection={<IconX size={16} />}
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						leftSection={<IconCheck size={16} />}
						onClick={onConfirm}
						loading={loading}
					>
						Confirm
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
