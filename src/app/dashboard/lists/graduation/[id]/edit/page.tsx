import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getGraduationList, updateGraduationList } from '@/server/lists/graduation/actions';
import Form from '../../Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GraduationListEdit({ params }: Props) {
	const { id } = await params;
	const graduationList = await getGraduationList(id);
	if (!graduationList) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Graduation List'}
				defaultValues={graduationList}
				onSubmit={async (value) => {
					'use server';
					return await updateGraduationList(id, value);
				}}
			/>
		</Box>
	);
}
