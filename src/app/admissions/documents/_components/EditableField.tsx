'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

type InputType = 'text' | 'select' | 'date';

type Props = {
	label: string;
	value: string | null | undefined;
	onSave: (value: string | null) => Promise<void>;
	inputType?: InputType;
	selectOptions?: { value: string; label: string }[];
	placeholder?: string;
	clearable?: boolean;
	hideLabel?: boolean;
};

export default function EditableField({
	label,
	value,
	onSave,
	inputType = 'text',
	selectOptions,
	placeholder,
	clearable = true,
	hideLabel = false,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [editValue, setEditValue] = useState(value ?? '');

	const mutation = useMutation({
		mutationFn: async (newValue: string | null) => {
			await onSave(newValue);
		},
		onSuccess: () => {
			close();
		},
	});

	const handleSave = () => {
		const newValue = editValue.trim() || null;
		mutation.mutate(newValue);
	};

	const handleCancel = () => {
		setEditValue(value ?? '');
		close();
	};

	const handleStartEdit = () => {
		setEditValue(value ?? '');
		open();
	};

	return (
		<>
			<div>
				{!hideLabel && (
					<Text size='xs' c='dimmed' mb={2}>
						{label}
					</Text>
				)}
				<Group gap={4} align='center' justify='space-between'>
					<Text size='sm' fw={500} style={{ flex: 1 }}>
						{value || (
							<Text span fs='italic' c='dimmed'>
								Empty
							</Text>
						)}
					</Text>
					<Tooltip label={`Edit ${label.toLowerCase()}`}>
						<ActionIcon
							size='xs'
							variant='subtle'
							c='dimmed'
							onClick={handleStartEdit}
						>
							<IconPencil size={12} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</div>
			<Modal
				opened={opened}
				onClose={handleCancel}
				title={`Edit ${label}`}
				centered
			>
				<Stack gap='sm'>
					<Stack gap={2}>
						<Text size='xs' c='dimmed'>
							Current Value
						</Text>
						<Text size='sm' fw={500}>
							{value || 'Empty'}
						</Text>
					</Stack>
					{inputType === 'select' && selectOptions ? (
						<Select
							label='New Value'
							data={selectOptions}
							value={editValue}
							onChange={(v) => setEditValue(v ?? '')}
							placeholder={placeholder || `Select ${label.toLowerCase()}`}
							searchable
							clearable={clearable}
						/>
					) : inputType === 'date' ? (
						<DateInput
							label='New Value'
							value={editValue}
							onChange={(v) => setEditValue(v ?? '')}
							placeholder={placeholder || 'YYYY-MM-DD'}
							valueFormat='YYYY-MM-DD'
							firstDayOfWeek={0}
							clearable={clearable}
						/>
					) : (
						<TextInput
							label='New Value'
							value={editValue}
							onChange={(e) => setEditValue(e.currentTarget.value)}
							placeholder={placeholder || label}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSave();
								if (e.key === 'Escape') handleCancel();
							}}
							autoFocus
						/>
					)}
					<Group justify='flex-end'>
						<Button
							variant='default'
							leftSection={<IconX size={14} />}
							onClick={handleCancel}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							leftSection={<IconCheck size={14} />}
							onClick={handleSave}
							loading={mutation.isPending}
						>
							Update
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
