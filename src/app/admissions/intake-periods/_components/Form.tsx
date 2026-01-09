'use client';

import { intakePeriods } from '@admissions/_database';
import { Group, NumberInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { IntakePeriod } from '../_lib/types';

type Props = {
	onSubmit: (values: IntakePeriod) => Promise<IntakePeriod>;
	defaultValues?: IntakePeriod;
	title?: string;
};

export default function IntakePeriodForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	const schema = z.object({
		...createInsertSchema(intakePeriods).shape,
		name: z.string().min(1, 'Name is required'),
		startDate: z.string().min(1, 'Start date is required'),
		endDate: z.string().min(1, 'End date is required'),
		applicationFee: z.string().min(1, 'Application fee is required'),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['intake-periods']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/admissions/intake-periods/${id}`)}
		>
			{(form) => (
				<>
					<TextInput
						label='Name'
						placeholder='e.g., February 2025 Intake'
						required
						{...form.getInputProps('name')}
					/>
					<Group grow>
						<DateInput
							label='Start Date'
							required
							firstDayOfWeek={0}
							{...form.getInputProps('startDate')}
						/>
						<DateInput
							label='End Date'
							required
							firstDayOfWeek={0}
							{...form.getInputProps('endDate')}
						/>
					</Group>
					<NumberInput
						label='Application Fee'
						required
						min={0}
						decimalScale={2}
						fixedDecimalScale
						prefix='M'
						value={
							form.values.applicationFee
								? Number(form.values.applicationFee)
								: undefined
						}
						onChange={(val) =>
							form.setFieldValue('applicationFee', val?.toString() || '')
						}
						error={form.errors.applicationFee}
					/>
				</>
			)}
		</Form>
	);
}
