'use client';

import { Button, Group, Modal, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { FilterButton } from './FilterButton';

export type FilterModalProps = {
	label: string;
	title: string;
	activeCount?: number;
	onApply: () => void;
	onClear: () => void;
	onOpen?: () => void;
	children: ReactNode | ((opened: boolean) => ReactNode);
};

export function FilterModal({
	label,
	title,
	activeCount = 0,
	onApply,
	onClear,
	onOpen,
	children,
}: FilterModalProps) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleOpen() {
		onOpen?.();
		open();
	}

	function handleApply() {
		onApply();
		close();
	}

	function handleClear() {
		onClear();
		close();
	}

	return (
		<>
			<FilterButton
				label={label}
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<Modal opened={opened} onClose={close} title={title}>
				<Stack gap='md'>
					{typeof children === 'function' ? children(opened) : children}
					<Group justify='space-between' mt='sm'>
						<Button
							variant='subtle'
							color='gray'
							leftSection={<IconX size={16} />}
							onClick={handleClear}
						>
							Clear All
						</Button>
						<Button
							leftSection={<IconFilter size={16} />}
							onClick={handleApply}
						>
							Apply Filters
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
