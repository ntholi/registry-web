import { Form } from '@academic/modules';
import { getModule, updateModule } from '@academic/modules/server';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ModuleEdit({ params }: Props) {
	const { id } = await params;
	const mod = await getModule(Number(id));
	if (!mod) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Module'}
				defaultValues={mod}
				onSubmit={async (value) => {
					'use server';
					return await updateModule(Number(id), value);
				}}
			/>
		</Box>
	);
}
