'use client';

import { NumberInput, Stack } from '@mantine/core';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { librarySettings } from '../_schema/librarySettings';
import { updateLibrarySettings } from '../_server/actions';

const schema = z.object({
	studentLoanDuration: z.number().min(1, 'Duration must be at least 1 day'),
	staffLoanDuration: z.number().min(1, 'Duration must be at least 1 day'),
});

type SettingsValues = z.infer<typeof schema>;

type Props = {
	initialData: typeof librarySettings.$inferSelect | null | undefined;
};

export default function LibrarySettingsForm({ initialData }: Props) {
	return (
		<Form<SettingsValues, SettingsValues, typeof librarySettings.$inferSelect>
			title='Library Settings'
			queryKey={['library-settings']}
			action={updateLibrarySettings}
			schema={schema}
			defaultValues={{
				studentLoanDuration: initialData?.studentLoanDuration ?? 14,
				staffLoanDuration: initialData?.staffLoanDuration ?? 30,
			}}
		>
			{(form) => (
				<Stack p='xl'>
					<NumberInput
						label='Student Loan Duration (Days)'
						placeholder='14'
						{...form.getInputProps('studentLoanDuration')}
						min={1}
						required
					/>
					<NumberInput
						label='Staff Loan Duration (Days)'
						placeholder='30'
						{...form.getInputProps('staffLoanDuration')}
						min={1}
						required
					/>
				</Stack>
			)}
		</Form>
	);
}
