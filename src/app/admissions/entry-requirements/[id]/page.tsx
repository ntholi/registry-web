import { Badge, Box, Group, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
} from '@/shared/ui/adease';
import { findActiveSubjects } from '../../subjects/_server/actions';
import RequirementsAccordion from '../_components/RequirementsAccordion';
import { findEntryRequirementsByProgram } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProgramEntryRequirements({ params }: Props) {
	const { id } = await params;
	const [requirements, subjects] = await Promise.all([
		findEntryRequirementsByProgram(Number(id)),
		findActiveSubjects(),
	]);

	if (!requirements || requirements.length === 0) {
		return notFound();
	}

	const program = requirements[0]?.program;

	if (!program) {
		return notFound();
	}

	const sortedRequirements = [...requirements].sort(
		(a, b) =>
			(a.certificateType?.lqfLevel || 0) - (b.certificateType?.lqfLevel || 0)
	);

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Entry Requirements'
				queryKey={['entry-requirements']}
				editRoles={['registry', 'marketing']}
			/>
			<DetailsViewBody>
				<Group gap='md' mb='lg' align='flex-start'>
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

				<Title order={5} mb='md'>
					Entry Pathways ({sortedRequirements.length} options)
				</Title>

				<RequirementsAccordion
					requirements={sortedRequirements}
					subjects={subjects}
				/>
			</DetailsViewBody>
		</DetailsView>
	);
}
