'use client';

import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { Form } from '@/components/adease';
import { signups } from '@/db/schema';

type Signup = typeof signups.$inferInsert;

type Props = {
	onSubmit: (values: Signup) => Promise<Signup>;
	defaultValues?: Signup;
	onSuccess?: (value: Signup) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function SignupForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['signups']}
			schema={createInsertSchema(signups)}
			defaultValues={defaultValues}
			onSuccess={({ userId }) => {
				router.push(`/dashboard/signups/${userId}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='User Id' {...form.getInputProps('userId')} />
					<TextInput label='Name' {...form.getInputProps('name')} />
					<TextInput label='Std No' {...form.getInputProps('stdNo')} />
					<TextInput label='Message' {...form.getInputProps('message')} />
				</>
			)}
		</Form>
	);
}
