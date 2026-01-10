import {
	Badge,
	Box,
	Group,
	Paper,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
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

const levelColors: Record<string, string> = {
	certificate: 'gray',
	diploma: 'blue',
	degree: 'green',
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
			/>
			<DetailsViewBody>
				<Paper withBorder p='lg' radius='md'>
					<Group gap='md' mb='lg'>
						<ThemeIcon size='xl' radius='md' variant='light'>
							<IconSchool size='1.5rem' />
						</ThemeIcon>
						<Box>
							<Group gap='xs'>
								<Title order={3}>{program.code}</Title>
								<Badge color={levelColors[program.level] || 'gray'} size='lg'>
									{program.level}
								</Badge>
							</Group>
							<Text c='dimmed' size='sm'>
								{program.name}
							</Text>
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
				</Paper>
			</DetailsViewBody>
		</DetailsView>
	);
}
