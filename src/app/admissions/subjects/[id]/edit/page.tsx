import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import { getSubject, updateSubject } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SubjectEdit({ params }: Props) {
	const { id } = await params;
	const item = unwrap(await getSubject(id));
	if (!item) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Subject'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return unwrap(await updateSubject(id, value));
				}}
			/>
		</Box>
	);
}
