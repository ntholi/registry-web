import { Badge, Box, Group, Stack, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
} from '@/shared/ui/adease';
import { findAllCertificateTypes } from '../../../certificate-types/_server/actions';
import { findActiveSubjects } from '../../../subjects/_server/actions';
import EditRequirementsList from '../../_components/EditRequirementsList';
import { findEntryRequirementsByProgram } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProgramEntryRequirementsEdit({ params }: Props) {
	const { id } = await params;
	const programId = Number(id);

	const [requirements, certificateTypesData, subjects] = await Promise.all([
		findEntryRequirementsByProgram(programId),
		findAllCertificateTypes(1, ''),
		findActiveSubjects(),
	]);

	if (!requirements || requirements.length === 0) {
		return notFound();
	}

	const program = requirements[0]?.program;
	if (!program) {
		return notFound();
	}

	const certificateTypes = certificateTypesData?.items || [];

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Edit Entry Requirements'
				queryKey={['entry-requirements']}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<Group gap='md' align='flex-start'>
						<Box>
							<Group gap='xs'>
								<Title order={4}>{program.code}</Title>
								<Badge variant='default'>{program.level}</Badge>
							</Group>
							<Text>{program.name}</Text>
							{program.school && (
								<Text size='xs' c='dimmed'>
									{program.school.name}
								</Text>
							)}
						</Box>
					</Group>

					<EditRequirementsList
						programId={programId}
						programLevel={program.level}
						requirements={requirements}
						certificateTypes={certificateTypes}
						subjects={subjects}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
