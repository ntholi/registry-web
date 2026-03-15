import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { Form, getTermByCode, updateTerm } from '@/app/registry/terms';
import { unwrap } from '@/shared/lib/utils/actionResult';

type Props = {
	params: Promise<{ code: string }>;
};

export default async function TermEdit({ params }: Props) {
	const { code } = await params;
	const term = unwrap(await getTermByCode(code));
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
					return await updateTerm(term.id, value);
				}}
			/>
		</Box>
	);
}
