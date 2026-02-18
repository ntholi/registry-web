import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getCategory, updateCategory } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CategoryEdit({ params }: Props) {
	const { id } = await params;
	const category = await getCategory(Number(id));

	if (!category) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Category'
				defaultValues={category}
				onSubmit={async (value) => {
					'use server';
					return await updateCategory(Number(id), value);
				}}
			/>
		</Box>
	);
}
