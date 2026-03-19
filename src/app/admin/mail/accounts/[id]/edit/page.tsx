import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	getMailAccount,
	updateMailAccount,
} from '../../../accounts/_server/actions';
import AccountForm from '../../_components/AccountForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditAccountPage({ params }: Props) {
	const { id } = await params;
	const account = await getMailAccount(id);

	if (!account) return notFound();

	return (
		<Box p='lg'>
			<AccountForm
				title='Edit Mail Account'
				defaultValues={{
					displayName: account.displayName ?? '',
					signature: account.signature ?? '',
					isActive: account.isActive,
				}}
				onSubmit={async (values) => {
					'use server';
					return updateMailAccount(id, values);
				}}
			/>
		</Box>
	);
}
