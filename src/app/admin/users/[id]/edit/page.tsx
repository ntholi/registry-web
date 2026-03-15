import { Form, getUser, updateUser } from '@admin/users';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function UserEdit({ params }: Props) {
	const { id } = await params;
	const user = unwrap(await getUser(id));
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
					return unwrap(await updateUser(id, value));
				}}
			/>
		</Box>
	);
}
