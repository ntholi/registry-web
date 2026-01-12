import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { Form, getTermByCode, updateTerm } from '@/app/registry/terms';

type Props = {
	params: Promise<{ code: string }>;
};

export default async function TermEdit({ params }: Props) {
	const { code } = await params;
	const term = await getTermByCode(code);
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
					const updatedTerm = await updateTerm(term.id, value);
					if (!updatedTerm) {
						throw new Error('Failed to update term');
					}
					return updatedTerm;
				}}
			/>
		</Box>
	);
}
