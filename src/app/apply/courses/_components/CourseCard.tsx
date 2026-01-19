import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import type {
	ProgramWithRequirements,
	SubjectGradeRules,
} from '@/app/admissions/entry-requirements';

type Subject = { id: string; name: string };

interface CourseCardProps {
	program: ProgramWithRequirements;
	subjects: Subject[];
}

export default function CourseCard({ program, subjects }: CourseCardProps) {
	const lgcseReq = program.entryRequirements.find(
		(r) => r.certificateType?.name?.toLowerCase() === 'lgcse'
	);

	const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
	const rules =
		lgcseReq?.rules?.type === 'subject-grades'
			? (lgcseReq.rules as SubjectGradeRules)
			: null;

	return (
		<Paper
			withBorder
			radius='xl'
			p='xl'
			h='100%'
			shadow='md'
			bg='var(--mantine-color-body)'
			style={{ borderColor: 'var(--mantine-color-default-border)' }}
		>
			<Stack gap='md' h='100%'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4} style={{ flex: 1 }}>
						<Text fw={600} size='lg' lh={1.2}>
							{program.name}
						</Text>
						<Text size='xs' c='dimmed' fw={500}>
							{program.school.shortName}
						</Text>
					</Stack>
					<Badge variant='outline' size='sm' radius='xl' color='gray'>
						{program.level}
					</Badge>
				</Group>

				<Divider />

				{!rules ? (
					<Box py='md'>
						<Text size='sm' c='dimmed' ta='center' fs='italic'>
							Entry requirements coming soon
						</Text>
					</Box>
				) : (
					<Stack gap='md' style={{ flex: 1 }}>
						<SimpleGrid cols={2} spacing='xs'>
							<SummaryCard
								label='Minimum passes'
								value={`${rules.minimumGrades.count} at ${rules.minimumGrades.grade}`}
							/>
							<SummaryCard
								label='Required subjects'
								value={`${rules.requiredSubjects.length}`}
							/>
						</SimpleGrid>

						<Paper
							p='md'
							radius='md'
							withBorder
							bg='var(--mantine-color-default-hover)'
						>
							<Stack gap='md'>
								<MinimumPassesSection rules={rules} />
								{rules.requiredSubjects.length > 0 && (
									<RequiredSubjectsSection
										subjects={rules.requiredSubjects}
										subjectMap={subjectMap}
									/>
								)}
								{rules.optionalSubjectGroups &&
									rules.optionalSubjectGroups.length > 0 && (
										<OptionalGroupsSection
											groups={rules.optionalSubjectGroups}
											subjectMap={subjectMap}
										/>
									)}
								{rules.alternatives && rules.alternatives.length > 0 && (
									<AlternativesSection
										alternatives={rules.alternatives}
										subjectMap={subjectMap}
									/>
								)}
							</Stack>
						</Paper>
					</Stack>
				)}
			</Stack>
		</Paper>
	);
}

interface SummaryCardProps {
	label: string;
	value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
	return (
		<Paper withBorder p='xs' radius='md' bg='var(--mantine-color-body)'>
			<Text size='xs' c='dimmed' fw={600} tt='uppercase'>
				{label}
			</Text>
			<Text size='sm' fw={600} mt={4}>
				{value}
			</Text>
		</Paper>
	);
}

interface MinimumPassesSectionProps {
	rules: SubjectGradeRules;
}

function MinimumPassesSection({ rules }: MinimumPassesSectionProps) {
	return (
		<Box>
			<Group gap='xs' wrap='nowrap' justify='space-between'>
				<Text size='xs' fw={600} c='dimmed'>
					Minimum passes
				</Text>
				<Badge size='xs' variant='outline' radius='sm' color='gray'>
					{rules.minimumGrades.count} at {rules.minimumGrades.grade}
				</Badge>
			</Group>
			<Text size='xs' mt={4}>
				{rules.minimumGrades.count} passes at grade {rules.minimumGrades.grade}{' '}
				or better
			</Text>
		</Box>
	);
}

interface RequiredSubjectsSectionProps {
	subjects: SubjectGradeRules['requiredSubjects'];
	subjectMap: Map<string, string>;
}

function RequiredSubjectsSection({
	subjects,
	subjectMap,
}: RequiredSubjectsSectionProps) {
	return (
		<Box>
			<Text size='xs' fw={600} c='dimmed' tt='uppercase' mb={6}>
				Required Subjects
			</Text>
			<Stack gap={6}>
				{subjects.map((sub, idx) => (
					<Box
						key={idx}
						px='xs'
						py={6}
						style={{
							border: '1px solid var(--mantine-color-default-border)',
							borderRadius: 'var(--mantine-radius-sm)',
						}}
					>
						<Group justify='space-between' wrap='nowrap'>
							<Text size='xs' truncate maw={200}>
								{subjectMap.get(sub.subjectId) || sub.subjectId}
							</Text>
							<Badge size='xs' variant='outline' color='gray'>
								{sub.minimumGrade}
							</Badge>
						</Group>
					</Box>
				))}
			</Stack>
		</Box>
	);
}

interface OptionalGroupsSectionProps {
	groups: NonNullable<SubjectGradeRules['optionalSubjectGroups']>;
	subjectMap: Map<string, string>;
}

function OptionalGroupsSection({
	groups,
	subjectMap,
}: OptionalGroupsSectionProps) {
	return (
		<Box>
			<Text size='xs' fw={600} c='dimmed' tt='uppercase' mb={6}>
				Subject Groups
			</Text>
			<Stack gap='xs'>
				{groups.map((group, idx) => (
					<Box
						key={idx}
						p='xs'
						style={{
							border: '1px solid var(--mantine-color-default-border)',
							borderRadius: 'var(--mantine-radius-sm)',
						}}
					>
						<Group justify='space-between' mb={4}>
							<Text size='xs' fw={500}>
								{group.name}
							</Text>
							<Group gap={4}>
								{group.required && (
									<Badge size='xs' color='gray' variant='outline'>
										Required
									</Badge>
								)}
								<Badge size='xs' variant='outline' color='gray'>
									Min: {group.minimumGrade}
								</Badge>
							</Group>
						</Group>
						<Text size='xs' c='dimmed' lineClamp={2}>
							{group.subjectIds
								.map((id) => subjectMap.get(id) || id)
								.join(' • ')}
						</Text>
					</Box>
				))}
			</Stack>
		</Box>
	);
}

interface AlternativesSectionProps {
	alternatives: SubjectGradeRules['alternatives'];
	subjectMap: Map<string, string>;
}

function AlternativesSection({
	alternatives,
	subjectMap,
}: AlternativesSectionProps) {
	if (!alternatives || alternatives.length === 0) return null;

	return (
		<Box>
			<Divider
				label={
					<Text size='xs' c='dimmed'>
						OR
					</Text>
				}
				labelPosition='center'
				my='xs'
			/>
			{alternatives.map((alt, idx) => (
				<Box
					key={idx}
					p='xs'
					style={{
						border: '1px solid var(--mantine-color-default-border)',
						borderRadius: 'var(--mantine-radius-sm)',
					}}
				>
					<Text size='xs' fw={600} mb={4}>
						Alternative Path
					</Text>
					<Text size='xs' c='dimmed' mb='xs'>
						{alt.minimumGrades.count} passes at grade {alt.minimumGrades.grade}
					</Text>
					{alt.requiredSubjects.length > 0 && (
						<Stack gap={4}>
							{alt.requiredSubjects.map((sub, subIdx) => (
								<Group key={subIdx} gap='xs' justify='space-between'>
									<Text size='xs' c='dimmed'>
										{subjectMap.get(sub.subjectId) || sub.subjectId}
									</Text>
									<Badge size='xs' variant='outline' color='gray'>
										{sub.minimumGrade}
									</Badge>
								</Group>
							))}
						</Stack>
					)}
				</Box>
			))}
		</Box>
	);
}
