'use client';

import {
	ActionIcon,
	Group,
	Select,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

type InputType = 'text' | 'select';

type Props = {
	label: string;
	value: string | null | undefined;
	onSave: (value: string | null) => Promise<void>;
	inputType?: InputType;
	selectOptions?: { value: string; label: string }[];
	placeholder?: string;
};

export default function EditableField({
	label,
	value,
	onSave,
	inputType = 'text',
	selectOptions,
	placeholder,
}: Props) {
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(value ?? '');

	const mutation = useMutation({
		mutationFn: async (newValue: string | null) => {
			await onSave(newValue);
		},
		onSuccess: () => {
			setEditing(false);
		},
	});

	const handleSave = () => {
		const newValue = editValue.trim() || null;
		mutation.mutate(newValue);
	};

	const handleCancel = () => {
		setEditValue(value ?? '');
		setEditing(false);
	};

	const handleStartEdit = () => {
		setEditValue(value ?? '');
		setEditing(true);
	};

	if (editing) {
		return (
			<div>
				<Text size='xs' c='dimmed' mb={2}>
					{label}
				</Text>
				<Group gap={4} align='flex-end'>
					{inputType === 'select' && selectOptions ? (
						<Select
							data={selectOptions}
							value={editValue}
							onChange={(v) => setEditValue(v ?? '')}
							placeholder={placeholder}
							searchable
							size='xs'
							style={{ flex: 1 }}
							clearable
						/>
					) : (
						<TextInput
							value={editValue}
							onChange={(e) => setEditValue(e.currentTarget.value)}
							placeholder={placeholder || label}
							size='xs'
							style={{ flex: 1 }}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSave();
								if (e.key === 'Escape') handleCancel();
							}}
							autoFocus
						/>
					)}
					<ActionIcon
						size='sm'
						color='green'
						variant='light'
						onClick={handleSave}
						loading={mutation.isPending}
					>
						<IconCheck size={12} />
					</ActionIcon>
					<ActionIcon
						size='sm'
						variant='subtle'
						onClick={handleCancel}
						disabled={mutation.isPending}
					>
						<IconX size={12} />
					</ActionIcon>
				</Group>
			</div>
		);
	}

	return (
		<div>
			<Text size='xs' c='dimmed' mb={2}>
				{label}
			</Text>
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
	);
}
