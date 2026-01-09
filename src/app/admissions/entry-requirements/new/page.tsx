import { getAllPrograms } from '@academic/schools/_server/actions';
import { Box } from '@mantine/core';
import { findAllCertificateTypes } from '../../certificate-types/_server/actions';
import { findActiveSubjects } from '../../subjects/_server/actions';
import Form from '../_components/Form';
import { createEntryRequirement } from '../_server/actions';

export default async function NewPage() {
	const [programsData, certificateTypesData, subjects] = await Promise.all([
		getAllPrograms(),
		findAllCertificateTypes(1, ''),
		findActiveSubjects(),
	]);

	const programs = programsData || [];
	const certificateTypes = certificateTypesData?.items || [];

	return (
		<Box p='lg'>
			<Form
				title='Create Entry Requirement'
				onSubmit={createEntryRequirement}
				programs={programs}
				certificateTypes={certificateTypes}
				subjects={subjects}
			/>
		</Box>
	);
}
