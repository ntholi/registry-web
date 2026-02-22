'use client';

import { intakePeriods } from '@admissions/_database';
import { Divider, Group, NumberInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { IntakePeriod } from '../_lib/types';
import ProgramSelector from './ProgramSelector';

type FormValues = IntakePeriod & { programIds?: number[] };

type Props = {
	onSubmit: (values: FormValues) => Promise<IntakePeriod>;
	defaultValues?: Partial<FormValues>;
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
		localApplicationFee: z.string().min(1, 'Local application fee is required'),
		internationalApplicationFee: z
			.string()
			.min(1, 'International application fee is required'),
		maxDocuments: z.number().min(1, 'Max documents must be at least 1'),
		programIds: z.number().array().optional(),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['intake-periods']}
			schema={schema}
			defaultValues={{
				maxDocuments: 18,
				...defaultValues,
			}}
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
					<Group grow align='end'>
						<NumberInput
							label='Local Application Fee'
							required
							min={0}
							decimalScale={2}
							fixedDecimalScale
							prefix='M'
							value={
								form.values.localApplicationFee
									? Number(form.values.localApplicationFee)
									: undefined
							}
							onChange={(val) =>
								form.setFieldValue('localApplicationFee', val?.toString() || '')
							}
							error={form.errors.localApplicationFee}
						/>
						<NumberInput
							label='International Application Fee'
							required
							min={0}
							decimalScale={2}
							fixedDecimalScale
							prefix='M'
							value={
								form.values.internationalApplicationFee
									? Number(form.values.internationalApplicationFee)
									: undefined
							}
							onChange={(val) =>
								form.setFieldValue(
									'internationalApplicationFee',
									val?.toString() || ''
								)
							}
							error={form.errors.internationalApplicationFee}
						/>
					</Group>
					<NumberInput
						label='Max Documents per Application'
						description='Total documents an applicant can upload'
						required
						min={1}
						max={100}
						{...form.getInputProps('maxDocuments')}
					/>
					<Divider my='sm' />
					<ProgramSelector
						value={form.values.programIds ?? []}
						onChange={(ids) => form.setFieldValue('programIds', ids)}
						error={form.errors.programIds as string | undefined}
					/>
				</>
			)}
		</Form>
	);
}
