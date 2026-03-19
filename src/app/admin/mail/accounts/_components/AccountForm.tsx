'use client';

import { Switch, Textarea, TextInput } from '@mantine/core';
import { useRouter } from 'nextjs-toploader/app';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';

type AccountFormValues = {
	displayName: string;
	signature: string;
	isActive: boolean;
};

type Props = {
	title: string;
	defaultValues: AccountFormValues;
	onSubmit: (values: AccountFormValues) => Promise<ActionResult<unknown>>;
};

export default function AccountForm({ title, defaultValues, onSubmit }: Props) {
	const router = useRouter();

	return (
		<Form<AccountFormValues, AccountFormValues, unknown>
			title={title}
			action={onSubmit}
			queryKey={['mail-accounts']}
			defaultValues={defaultValues}
			onSuccess={() => {
				router.back();
			}}
		>
			{(form) => (
				<>
					<TextInput
						label='Display Name'
						placeholder='Name shown in From header'
						{...form.getInputProps('displayName')}
					/>
					<Textarea
						label='Signature'
						placeholder='HTML signature for outgoing emails'
						autosize
						minRows={3}
						{...form.getInputProps('signature')}
					/>
					<Switch
						label='Active'
						description='Enable or disable this account'
						{...form.getInputProps('isActive', { type: 'checkbox' })}
					/>
				</>
			)}
		</Form>
	);
}
