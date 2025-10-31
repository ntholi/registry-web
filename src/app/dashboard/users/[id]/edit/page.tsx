import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getUser, updateUser } from '@/server/users/actions';
import Form from '../../Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function UserEdit({ params }: Props) {
	const { id } = await params;
	const user = await getUser(id);
	if (!user) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit User'}
				defaultValues={user}
				onSubmit={async (value) => {
					'use server';
					return await updateUser(id, value);
				}}
			/>
		</Box>
	);
}
