import { Box } from '@mantine/core';
import {
	Form,
	getGraduationByDate,
	updateGraduation,
} from '@registry/dates/graduations';
import { getAllTerms } from '@registry/dates/terms';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ date: string }>;
};

export default async function EditPage({ params }: Props) {
	const { date } = await params;
	const graduation = await getGraduationByDate(date);
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
					return updateGraduation(graduation.id, values);
				}}
			/>
		</Box>
	);
}
