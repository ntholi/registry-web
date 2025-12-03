'use client';

import { NumberInput, Paper, Stack, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import type { FormValues } from './index';

type SettingsPanelProps = {
	form: UseFormReturnType<FormValues>;
};

export default function SettingsPanel({ form }: SettingsPanelProps) {
	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Text fw={500} size='sm'>
					Settings
				</Text>

				<NumberInput
					label='Total Marks'
					placeholder='100'
					min={1}
					{...form.getInputProps('totalMarks')}
				/>

				<NumberInput
					label='Weight (%)'
					placeholder='0'
					min={0}
					max={100}
					{...form.getInputProps('weight')}
				/>

				<DateTimePicker
					label='Available From'
					firstDayOfWeek={0}
					placeholder='Select date and time'
					valueFormat='DD MMM YYYY HH:mm'
					clearable
					{...form.getInputProps('availableFrom')}
				/>

				<DateTimePicker
					label='Due Date'
					firstDayOfWeek={0}
					placeholder='Select date and time'
					valueFormat='DD MMM YYYY HH:mm'
					withAsterisk
					{...form.getInputProps('dueDate')}
				/>
			</Stack>
		</Paper>
	);
}
