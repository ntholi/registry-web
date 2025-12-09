'use client';

import { Alert, Box, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';

type Props = {
	itemName: string;
	itemType?: string;
	onConfirmChange: (isValid: boolean) => void;
	warningMessage?: string;
};

export default function DeleteConfirmContent({
	itemName,
	itemType = 'item',
	onConfirmChange,
	warningMessage,
}: Props) {
	const [value, setValue] = useState('');

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const newValue = e.target.value;
		setValue(newValue);
		onConfirmChange(newValue === 'delete permanently');
	}

	return (
		<Box>
			<Alert
				icon={<IconAlertTriangle size={16} />}
				title='Warning'
				color='red'
				mb='md'
			>
				<Text fw={500} mb='xs'>
					You are about to delete {itemType} "{itemName}".
				</Text>
				<Text size='sm'>
					{warningMessage ||
						'This will permanently remove all associated data. This action cannot be undone.'}
				</Text>
			</Alert>

			<Text size='sm' mb='md'>
				To confirm deletion, please type{' '}
				<Text span fw={700}>
					delete permanently
				</Text>{' '}
				in the field below:
			</Text>

			<TextInput
				placeholder='delete permanently'
				value={value}
				onChange={handleChange}
				data-autofocus
			/>
		</Box>
	);
}
