'use client';

import { externalLibraries } from '@library/_database';
import { PasswordInput, Stack, Textarea, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';
import type { ExternalLibrary, ExternalLibraryInsert } from '../_lib/types';

type Props = {
	onSubmit: (values: ExternalLibraryInsert) => Promise<ExternalLibrary>;
	defaultValues?: ExternalLibrary;
	title?: string;
};

export default function ExternalLibraryForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['external-libraries']}
			schema={createInsertSchema(externalLibraries)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/external-libraries/${id}`)}
		>
			{(form) => (
				<Stack>
					<TextInput label='Name' required {...form.getInputProps('name')} />
					<TextInput
						label='URL'
						required
						type='url'
						placeholder='https://...'
						{...form.getInputProps('url')}
					/>
					<TextInput label='Username' {...form.getInputProps('username')} />
					<PasswordInput label='Password' {...form.getInputProps('password')} />
					<Textarea
						label='Description / Instructions'
						rows={3}
						{...form.getInputProps('description')}
					/>
				</Stack>
			)}
		</Form>
	);
}
