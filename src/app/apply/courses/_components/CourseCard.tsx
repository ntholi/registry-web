import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconBook,
	IconBooks,
	IconCheck,
	IconStarFilled,
} from '@tabler/icons-react';
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
			radius='lg'
			p='lg'
			h='100%'
			style={{
				background:
					'linear-gradient(145deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
			}}
		>
			<Stack gap='md' h='100%'>
				<Box>
					<Group justify='space-between' align='flex-start' mb={6}>
						<Text fw={600} size='md' lh={1.3} style={{ flex: 1 }}>
							{program.name}
						</Text>
						<Badge variant='light' size='sm' radius='sm'>
							{program.level}
						</Badge>
					</Group>
					<Text size='xs' c='dimmed'>
						{program.school.shortName}
					</Text>
				</Box>

				<Divider />

				{!rules ? (
					<Box py='md'>
						<Text size='sm' c='dimmed' ta='center' fs='italic'>
							Entry requirements coming soon
						</Text>
					</Box>
				) : (
					<Stack gap='sm' style={{ flex: 1 }}>
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
				)}
			</Stack>
		</Paper>
	);
}

interface MinimumPassesSectionProps {
	rules: SubjectGradeRules;
}

function MinimumPassesSection({ rules }: MinimumPassesSectionProps) {
	return (
		<Paper p='sm' radius='md' bg='var(--mantine-color-blue-light)'>
			<Group gap='xs' wrap='nowrap'>
				<ThemeIcon size='sm' radius='xl' variant='light' color='blue'>
					<IconCheck size={12} />
				</ThemeIcon>
				<Text size='xs' fw={500}>
					{rules.minimumGrades.count} passes at grade{' '}
					{rules.minimumGrades.grade} or better
				</Text>
			</Group>
		</Paper>
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
			<Group gap={6} mb='xs'>
				<ThemeIcon size='xs' variant='transparent' c='yellow'>
					<IconStarFilled size={10} />
				</ThemeIcon>
				<Text size='xs' fw={600} c='dimmed' tt='uppercase'>
					Required Subjects
				</Text>
			</Group>
			<Stack gap={4}>
				{subjects.map((sub, idx) => (
					<Paper
						key={idx}
						px='sm'
						py={6}
						radius='sm'
						bg='var(--mantine-color-dark-6)'
					>
						<Group justify='space-between' wrap='nowrap'>
							<Group gap='xs' wrap='nowrap'>
								<ThemeIcon size='xs' variant='light' color='grape' radius='xl'>
									<IconBook size={10} />
								</ThemeIcon>
								<Text size='xs' truncate maw={140}>
									{subjectMap.get(sub.subjectId) || sub.subjectId}
								</Text>
							</Group>
							<Badge size='xs' variant='outline' color='gray'>
								{sub.minimumGrade}
							</Badge>
						</Group>
					</Paper>
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
			<Group gap={6} mb='xs'>
				<ThemeIcon size='xs' variant='transparent' c='teal'>
					<IconBooks size={12} />
				</ThemeIcon>
				<Text size='xs' fw={600} c='dimmed' tt='uppercase'>
					Subject Groups
				</Text>
			</Group>
			<Stack gap='xs'>
				{groups.map((group, idx) => (
					<Paper
						key={idx}
						p='xs'
						radius='sm'
						withBorder
						style={{ borderColor: 'var(--mantine-color-dark-4)' }}
					>
						<Group justify='space-between' mb={4}>
							<Text size='xs' fw={500}>
								{group.name}
							</Text>
							<Group gap={4}>
								{group.required && (
									<Badge size='xs' color='red' variant='light'>
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
					</Paper>
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
				<Paper
					key={idx}
					p='sm'
					radius='sm'
					withBorder
					style={{ borderColor: 'var(--mantine-color-orange-6)' }}
				>
					<Text size='xs' fw={500} c='orange' mb='xs'>
						Alternative Path
					</Text>
					<Text size='xs' mb='xs'>
						{alt.minimumGrades.count} passes at grade {alt.minimumGrades.grade}
					</Text>
					{alt.requiredSubjects.length > 0 && (
						<Stack gap={4}>
							{alt.requiredSubjects.map((sub, subIdx) => (
								<Group key={subIdx} gap='xs' justify='space-between'>
									<Text size='xs' c='dimmed'>
										{subjectMap.get(sub.subjectId) || sub.subjectId}
									</Text>
									<Badge size='xs' variant='outline'>
										{sub.minimumGrade}
									</Badge>
								</Group>
							))}
						</Stack>
					)}
				</Paper>
			))}
		</Box>
	);
}
