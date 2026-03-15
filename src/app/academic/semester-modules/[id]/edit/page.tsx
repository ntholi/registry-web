import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';
import { getSemesterModule, updateModule } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ModuleEdit({ params }: Props) {
	const { id } = await params;
	const item = unwrap(await getSemesterModule(Number(id)));
	if (!item) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Module'}
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return await updateModule(Number(id), value);
				}}
			/>
		</Box>
	);
}
