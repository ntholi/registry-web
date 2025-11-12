import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getTerm, updateTerm } from '@/server/registry/terms/actions';
import Form from '../../Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function TermEdit({ params }: Props) {
	const { id } = await params;
	const term = await getTerm(Number(id));
	if (!term) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Term'}
				defaultValues={term}
				onSubmit={async (value) => {
					'use server';
					const updatedTerm = await updateTerm(Number(id), value);
					if (!updatedTerm) {
						throw new Error('Failed to update term');
					}
					return updatedTerm;
				}}
			/>
		</Box>
	);
}
