'use client';

import { Button, Checkbox, Group, Modal, Stack, Text } from '@mantine/core';
import { useState } from 'react';

type Column = {
	name: string;
	description: string;
};

type ColumnConfirmModalProps = {
	opened: boolean;
	columns: Column[];
	onConfirm: (selected: string[]) => void;
	onClose: () => void;
};

export default function ColumnConfirmModal({
	opened,
	columns,
	onConfirm,
	onClose,
}: ColumnConfirmModalProps) {
	const [selected, setSelected] = useState<string[]>(
		columns.map((c) => c.name)
	);

	function handleToggle(name: string) {
		setSelected((prev) =>
			prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
		);
	}

	function handleConfirm() {
		if (selected.length > 0) {
			onConfirm(selected);
		}
	}

	return (
		<Modal opened={opened} onClose={onClose} title='Select Columns' size='md'>
			<Stack gap='sm'>
				<Text size='sm' c='dimmed'>
					The AI identified multiple possible column sets. Select the columns
					you want in your results:
				</Text>
				{columns.map((col) => (
					<Checkbox
						key={col.name}
						label={
							<Group gap='xs'>
								<Text size='sm' fw={500}>
									{col.name}
								</Text>
								<Text size='xs' c='dimmed'>
									— {col.description}
								</Text>
							</Group>
						}
						checked={selected.includes(col.name)}
						onChange={() => handleToggle(col.name)}
					/>
				))}
				<Group justify='flex-end' mt='md'>
					<Button variant='default' onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={selected.length === 0}>
						Run Query
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
