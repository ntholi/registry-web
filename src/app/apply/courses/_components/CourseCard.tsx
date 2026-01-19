import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import type {
	EntryRules,
	ProgramWithRequirements,
} from '@/app/admissions/entry-requirements';

interface CourseCardProps {
	program: ProgramWithRequirements;
}

export default function CourseCard({ program }: CourseCardProps) {
	const lgcseRequirements = program.entryRequirements.filter(
		(requirement) =>
			requirement.certificateType?.name?.toLowerCase() === 'lgcse'
	);

	return (
		<Paper withBorder radius='lg' p='lg' h='100%'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Text fw={600}>{program.name}</Text>
						<Text size='sm' c='dimmed'>
							{program.school.shortName}
						</Text>
					</Stack>
					<Badge variant='light'>{program.level}</Badge>
				</Group>

				<Divider />

				<Stack gap={6}>
					<Text size='sm' c='dimmed'>
						Entry requirements
					</Text>
					{lgcseRequirements.length === 0 ? (
						<Text size='sm' c='dimmed'>
							Entry requirements are not available yet.
						</Text>
					) : (
						<Stack gap='xs'>
							{lgcseRequirements.map((requirement) => (
								<Text key={requirement.id} size='sm'>
									{formatRequirementSummary(requirement.rules)}
								</Text>
							))}
						</Stack>
					)}
				</Stack>
			</Stack>
		</Paper>
	);
}

function formatRequirementSummary(rules: EntryRules) {
	if (rules.type === 'subject-grades') {
		return `Minimum ${rules.minimumGrades.count} passes at grade ${rules.minimumGrades.grade}`;
	}

	return `Minimum ${rules.minimumClassification} classification`;
}
