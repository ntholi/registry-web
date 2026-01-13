'use client';

import { NumberInput, Switch, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { terms } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { formatDateToISO } from '@/shared/lib/utils/dates';
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

export default function TermForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['terms']}
			schema={createInsertSchema(terms)}
			defaultValues={defaultValues}
			onSuccess={({ code }) => {
				router.push(`/registry/terms/${code}`);
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
						value={form.values.startDate}
						onChange={(date) =>
							form.setFieldValue('startDate', formatDateToISO(date))
						}
						error={form.errors.startDate}
					/>
					<DateInput
						label='End Date'
						value={form.values.endDate}
						onChange={(date) =>
							form.setFieldValue('endDate', formatDateToISO(date))
						}
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
