'use client';

import { Button, Group, Modal, Stack } from '@mantine/core';
import { IconFilter, IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export type FilterModalProps = {
	opened: boolean;
	onClose: () => void;
	title: string;
	onApply: () => void;
	onClear: () => void;
	children: ReactNode;
};

export function FilterModal({
	opened,
	onClose,
	title,
	onApply,
	onClear,
	children,
}: FilterModalProps) {
	return (
		<Modal opened={opened} onClose={onClose} title={title}>
			<Stack gap='md'>
				{children}
				<Group justify='space-between' mt='sm'>
					<Button
						variant='subtle'
						color='gray'
						leftSection={<IconX size={16} />}
						onClick={onClear}
					>
						Clear All
					</Button>
					<Button leftSection={<IconFilter size={16} />} onClick={onApply}>
						Apply Filters
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
