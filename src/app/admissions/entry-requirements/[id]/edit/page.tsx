import { getAllPrograms } from '@academic/schools/_server/actions';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { findAllCertificateTypes } from '../../../certificate-types/_server/actions';
import { findActiveSubjects } from '../../../subjects/_server/actions';
import Form from '../../_components/Form';
import {
	getEntryRequirement,
	updateEntryRequirement,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EntryRequirementEdit({ params }: Props) {
	const { id } = await params;
	const [item, programsData, certificateTypesData, subjects] =
		await Promise.all([
			getEntryRequirement(Number(id)),
			getAllPrograms(),
			findAllCertificateTypes(1, ''),
			findActiveSubjects(),
		]);

	if (!item) {
		return notFound();
	}

	const programs = programsData || [];
	const certificateTypes = certificateTypesData?.items || [];

	return (
		<Box p='lg'>
			<Form
				title='Edit Entry Requirement'
				defaultValues={item}
				programs={programs}
				certificateTypes={certificateTypes}
				subjects={subjects}
				onSubmit={async (value) => {
					'use server';
					return await updateEntryRequirement(Number(id), value);
				}}
			/>
		</Box>
	);
}
