'use client';

import { NumberInput, Switch, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { terms } from '@/modules/registry/database';
import { Form } from '@/shared/ui/adease';

type Term = typeof terms.$inferInsert;

type Props = {
	onSubmit: (values: Term) => Promise<Term>;
	defaultValues?: Term;
	onSuccess?: (value: Term) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

function formatDate(date: Date | string | null): string {
	if (!date) return '';
	if (typeof date === 'string') return date;
	return date.toISOString().split('T')[0];
}

function parseDate(dateStr: string | undefined): Date | undefined {
	if (!dateStr) return undefined;
	return new Date(dateStr);
}

export default function TermForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['terms']}
			schema={createInsertSchema(terms)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/registry/terms/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Code' {...form.getInputProps('code')} />
					<TextInput label='Name' {...form.getInputProps('name')} />
					<NumberInput
						label='Year'
						min={2000}
						max={2100}
						{...form.getInputProps('year')}
					/>
					<DateInput
						label='Start Date'
						valueFormat='YYYY-MM-DD'
						value={parseDate(form.values.startDate)}
						onChange={(date) =>
							form.setFieldValue('startDate', formatDate(date))
						}
						error={form.errors.startDate}
					/>
					<DateInput
						label='End Date'
						valueFormat='YYYY-MM-DD'
						value={parseDate(form.values.endDate)}
						onChange={(date) => form.setFieldValue('endDate', formatDate(date))}
						error={form.errors.endDate}
					/>
					<NumberInput
						min={1}
						max={2}
						label='Semester'
						description='Semester 1 or Semester 2'
						{...form.getInputProps('semester')}
					/>
					<Switch
						label='Set as Active Term'
						{...form.getInputProps('isActive', { type: 'checkbox' })}
					/>
				</>
			)}
		</Form>
	);
}
