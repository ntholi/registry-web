import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getCategory, updateCategory } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CategoryEdit({ params }: Props) {
	const { id } = await params;
	const item = await getCategory(id);
	if (!item) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Category'}
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return await updateCategory(id, value);
				}}
			/>
		</Box>
	);
}
