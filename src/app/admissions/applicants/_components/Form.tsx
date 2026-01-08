'use client';

import { applicants } from '@admissions/_database';
import { Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';
import type { Applicant } from '../_lib/types';

type ApplicantInput = typeof applicants.$inferInsert;

type Props = {
	onSubmit: (values: ApplicantInput) => Promise<ApplicantInput>;
	defaultValues?: Applicant;
	title?: string;
};

const genderOptions = [
	{ value: 'Male', label: 'Male' },
	{ value: 'Female', label: 'Female' },
];

export default function ApplicantForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['applicants']}
			schema={createInsertSchema(applicants)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/admissions/applicants/${id}`)}
		>
			{(form) => (
				<>
					<TextInput
						label='Full Name'
						placeholder='Enter full name'
						required
						{...form.getInputProps('fullName')}
					/>
					<DateInput
						label='Date of Birth'
						placeholder='Select date of birth'
						required
						valueFormat='YYYY-MM-DD'
						{...form.getInputProps('dateOfBirth')}
					/>
					<TextInput
						label='National ID'
						placeholder='Enter national ID'
						{...form.getInputProps('nationalId')}
					/>
					<TextInput
						label='Nationality'
						placeholder='Enter nationality'
						required
						{...form.getInputProps('nationality')}
					/>
					<Select
						label='Gender'
						placeholder='Select gender'
						data={genderOptions}
						required
						{...form.getInputProps('gender')}
					/>
					<TextInput
						label='Birth Place'
						placeholder='Enter birth place'
						{...form.getInputProps('birthPlace')}
					/>
					<TextInput
						label='Religion'
						placeholder='Enter religion'
						{...form.getInputProps('religion')}
					/>
					<Textarea
						label='Address'
						placeholder='Enter address'
						rows={3}
						{...form.getInputProps('address')}
					/>
				</>
			)}
		</Form>
	);
}
