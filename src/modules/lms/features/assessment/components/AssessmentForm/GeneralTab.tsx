'use client';

import { Grid, NumberInput, Select, Stack } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import {
	ASSESSMENT_TYPES,
	COURSE_WORK_OPTIONS,
} from '@/modules/academic/features/assessments/utils';

type FormValues = {
	assessmentNumber: string;
	assessmentType: string;
	totalMarks: number;
	weight: number;
	availableFrom: string | null;
	dueDate: string | null;
	description?: string;
	instructions?: string;
	attachments?: File[];
};

type GeneralTabProps = {
	form: UseFormReturnType<FormValues>;
};

export default function GeneralTab({ form }: GeneralTabProps) {
	return (
		<Stack>
			<Select
				label='Assessment Number'
				placeholder='Select assessment number'
				searchable
				clearable
				data={COURSE_WORK_OPTIONS}
				required
				{...form.getInputProps('assessmentNumber')}
			/>
			<Select
				label='Assessment Type'
				placeholder='Select assessment type'
				searchable
				clearable
				data={ASSESSMENT_TYPES}
				required
				{...form.getInputProps('assessmentType')}
			/>

			<Grid>
				<Grid.Col span={6}>
					<NumberInput
						label='Total Marks'
						placeholder='100'
						min={1}
						required
						{...form.getInputProps('totalMarks')}
					/>
				</Grid.Col>
				<Grid.Col span={6}>
					<NumberInput
						label='Weight (%)'
						placeholder='0'
						min={0}
						max={100}
						required
						{...form.getInputProps('weight')}
					/>
				</Grid.Col>
			</Grid>

			<DateTimePicker
				label='Available From'
				placeholder='Select date and time'
				valueFormat='DD MMMM YYYY HH:mm'
				{...form.getInputProps('availableFrom')}
			/>

			<DateTimePicker
				label='Due Date'
				placeholder='Select date and time'
				valueFormat='DD MMMM YYYY HH:mm'
				required
				{...form.getInputProps('dueDate')}
			/>
		</Stack>
	);
}
