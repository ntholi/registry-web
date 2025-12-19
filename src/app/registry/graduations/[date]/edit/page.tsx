import { Box } from '@mantine/core';
import { Form, getGraduation, updateGraduation } from '@registry/graduations';
import { getAllTerms } from '@registry/terms';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
	const { id } = await params;
	const graduation = await getGraduation(Number(id));
	const terms = await getAllTerms();

	if (!graduation) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Graduation'}
				defaultValues={graduation}
				terms={terms.map((t) => ({ id: t.id, code: t.code }))}
				onSubmit={async (values) => {
					'use server';
					return updateGraduation(Number(id), values);
				}}
			/>
		</Box>
	);
}
