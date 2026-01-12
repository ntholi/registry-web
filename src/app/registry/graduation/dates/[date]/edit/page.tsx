import { Box } from '@mantine/core';
import {
	Form,
	getGraduationByDate,
	updateGraduation,
} from '@registry/graduation/dates';
import { notFound } from 'next/navigation';
import { getAllTerms } from '@/app/registry/terms';

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
