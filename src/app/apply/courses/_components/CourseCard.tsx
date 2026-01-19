'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconCircleCheck, IconRoute } from '@tabler/icons-react';
import type {
	ProgramWithRequirements,
	SubjectGradeRules,
} from '@/app/admissions/entry-requirements';

type Subject = { id: string; name: string };

interface Props {
	program: ProgramWithRequirements;
	subjects: Subject[];
}

export default function CourseCard({ program, subjects }: Props) {
	const lgcseReq = program.entryRequirements.find(
		(r) => r.certificateType?.name?.toLowerCase() === 'lgcse'
	);

	const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
	const rules =
		lgcseReq?.rules?.type === 'subject-grades'
			? (lgcseReq.rules as SubjectGradeRules)
			: null;

	return (
		<Paper h='100%' radius='md' withBorder p='lg'>
			<Stack gap='md' h='100%'>
				<Box>
					<Group
						justify='space-between'
						align='flex-start'
						wrap='nowrap'
						mb='xs'
					>
						<Badge variant='light' size='sm' radius='sm' tt='uppercase'>
							{program.level}
						</Badge>
						<Text size='xs' c='dimmed' fw={500}>
							{program.school.shortName}
						</Text>
					</Group>
					<Title order={4} lh={1.35}>
						{program.name}
					</Title>
				</Box>

				<Divider />

				{!rules ? (
					<Text size='sm' c='dimmed' fs='italic'>
						Entry requirements will be published soon.
					</Text>
				) : (
					<Stack gap='md' style={{ flex: 1 }}>
						<Group gap='xs'>
							<Text size='sm' fw={500}>
								LGCSE Requirements
							</Text>
							<Badge size='xs' variant='outline' color='gray'>
								{rules.minimumGrades.count} passes @ {rules.minimumGrades.grade}
							</Badge>
						</Group>

						{rules.requiredSubjects.length > 0 && (
							<RequiredSubjects
								subjects={rules.requiredSubjects}
								subjectMap={subjectMap}
							/>
						)}

						{rules.optionalSubjectGroups &&
							rules.optionalSubjectGroups.length > 0 && (
								<OptionalGroups
									groups={rules.optionalSubjectGroups}
									subjectMap={subjectMap}
								/>
							)}

						{rules.alternatives && rules.alternatives.length > 0 && (
							<Alternatives
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

interface RequiredSubjectsProps {
	subjects: SubjectGradeRules['requiredSubjects'];
	subjectMap: Map<string, string>;
}

function RequiredSubjects({ subjects, subjectMap }: RequiredSubjectsProps) {
	return (
		<Box>
			<Text size='xs' c='dimmed' fw={600} mb='xs'>
				MUST HAVE
			</Text>
			<Stack gap={4}>
				{subjects.map((sub, idx) => (
					<Group key={idx} gap='xs' wrap='nowrap'>
						<IconCircleCheck
							size={14}
							color='var(--mantine-color-teal-filled)'
						/>
						<Text size='sm' style={{ flex: 1 }} truncate>
							{subjectMap.get(sub.subjectId) || sub.subjectId}
						</Text>
						<Text size='xs' c='dimmed' fw={600}>
							{sub.minimumGrade}
						</Text>
					</Group>
				))}
			</Stack>
		</Box>
	);
}

interface OptionalGroupsProps {
	groups: NonNullable<SubjectGradeRules['optionalSubjectGroups']>;
	subjectMap: Map<string, string>;
}

function OptionalGroups({ groups, subjectMap }: OptionalGroupsProps) {
	return (
		<Box>
			<Text size='xs' c='dimmed' fw={600} mb='xs'>
				FROM GROUPS
			</Text>
			<Stack gap='sm'>
				{groups.map((group, idx) => (
					<Box
						key={idx}
						p='sm'
						style={{
							borderRadius: 'var(--mantine-radius-sm)',
							backgroundColor: 'var(--mantine-color-default-hover)',
						}}
					>
						<Group justify='space-between' mb={4}>
							<Text size='sm' fw={500}>
								{group.name}
							</Text>
							<Group gap={6}>
								{group.required && (
									<Badge size='xs' color='red' variant='light'>
										Required
									</Badge>
								)}
								<Text size='xs' c='dimmed'>
									Min: {group.minimumGrade}
								</Text>
							</Group>
						</Group>
						<Text size='xs' c='dimmed' lineClamp={2}>
							{group.subjectIds
								.map((id) => subjectMap.get(id) || id)
								.join(' · ')}
						</Text>
					</Box>
				))}
			</Stack>
		</Box>
	);
}

interface AlternativesProps {
	alternatives: SubjectGradeRules['alternatives'];
	subjectMap: Map<string, string>;
}

function Alternatives({ alternatives, subjectMap }: AlternativesProps) {
	if (!alternatives || alternatives.length === 0) return null;

	return (
		<Box>
			<Group gap='xs' mb='xs'>
				<IconRoute size={14} color='var(--mantine-color-orange-filled)' />
				<Text size='xs' c='orange' fw={600}>
					ALTERNATIVE PATH
				</Text>
			</Group>
			<Stack gap='sm'>
				{alternatives.map((alt, idx) => (
					<Box
						key={idx}
						p='sm'
						style={{
							borderRadius: 'var(--mantine-radius-sm)',
							border: '1px dashed var(--mantine-color-orange-light)',
							backgroundColor: 'var(--mantine-color-orange-light)',
						}}
					>
						<Text size='sm' fw={500} mb={6}>
							{alt.minimumGrades.count} passes at {alt.minimumGrades.grade}
						</Text>
						{alt.requiredSubjects.length > 0 && (
							<Stack gap={2}>
								{alt.requiredSubjects.map((sub, subIdx) => (
									<Group key={subIdx} gap='xs' wrap='nowrap'>
										<Text size='xs' c='dimmed' style={{ flex: 1 }}>
											{subjectMap.get(sub.subjectId) || sub.subjectId}
										</Text>
										<Text size='xs' fw={500}>
											{sub.minimumGrade}
										</Text>
									</Group>
								))}
							</Stack>
						)}
					</Box>
				))}
			</Stack>
		</Box>
	);
}
