'use client';

import {
	Accordion,
	Badge,
	Box,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCertificate, IconChecklist } from '@tabler/icons-react';
import { FieldView } from '@/shared/ui/adease';
import type { ClassificationRules, SubjectGradeRules } from '../_lib/types';

type EntryRequirementItem = {
	id: number;
	rules: unknown;
	certificateType: {
		id: number;
		name: string;
		lqfLevel: number;
	} | null;
};

type Props = {
	requirements: EntryRequirementItem[];
};

export default function RequirementsAccordion({ requirements }: Props) {
	return (
		<Accordion variant='separated' radius='md'>
			{requirements.map((req, index) => {
				const rules = req.rules as SubjectGradeRules | ClassificationRules;
				const isSubjectBased = rules?.type === 'subject-grades';
				const certType = req.certificateType;

				return (
					<Accordion.Item key={req.id} value={req.id.toString()}>
						<Accordion.Control>
							<Group gap='md'>
								<ThemeIcon
									size='md'
									radius='xl'
									variant='light'
									color={index === 0 ? 'green' : 'blue'}
								>
									<IconCertificate size='1rem' />
								</ThemeIcon>
								<Box>
									<Group gap='xs'>
										<Text fw={500}>{certType?.name || 'Unknown'}</Text>
										<Badge size='sm' variant='outline'>
											LQF Level {certType?.lqfLevel}
										</Badge>
									</Group>
									<Text size='xs' c='dimmed'>
										{isSubjectBased
											? `Minimum ${(rules as SubjectGradeRules).minimumGrades.count} passes at grade ${(rules as SubjectGradeRules).minimumGrades.grade}`
											: `Minimum ${(rules as ClassificationRules).minimumClassification} classification`}
									</Text>
								</Box>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<RequirementDetails rules={rules} />
						</Accordion.Panel>
					</Accordion.Item>
				);
			})}
		</Accordion>
	);
}

type RequirementDetailsProps = {
	rules: SubjectGradeRules | ClassificationRules;
};

function RequirementDetails({ rules }: RequirementDetailsProps) {
	const isSubjectBased = rules?.type === 'subject-grades';

	if (isSubjectBased) {
		const sgRules = rules as SubjectGradeRules;
		return (
			<Stack gap='md'>
				<Paper withBorder p='md' bg='var(--mantine-color-dark-7)'>
					<Group gap='xs' mb='xs'>
						<IconChecklist size='1rem' />
						<Text fw={500} size='sm'>
							General Requirements
						</Text>
					</Group>
					<Text size='sm'>
						Minimum of <strong>{sgRules.minimumGrades.count}</strong> subjects
						passed at grade <strong>{sgRules.minimumGrades.grade}</strong> or
						better
					</Text>
				</Paper>

				{sgRules.requiredSubjects.length > 0 && (
					<Box>
						<Text fw={500} size='sm' mb='xs'>
							Required Subjects
						</Text>
						<Stack gap='xs'>
							{sgRules.requiredSubjects.map((rs, idx) => (
								<Paper
									key={idx}
									withBorder
									p='sm'
									bg='var(--mantine-color-dark-7)'
								>
									<Group justify='space-between'>
										<Text size='sm'>Subject #{rs.subjectId}</Text>
										<Badge size='sm'>Min: {rs.minimumGrade}</Badge>
									</Group>
								</Paper>
							))}
						</Stack>
					</Box>
				)}

				{sgRules.optionalSubjectGroups &&
					sgRules.optionalSubjectGroups.length > 0 && (
						<Box>
							<Text fw={500} size='sm' mb='xs'>
								Optional Subject Groups
							</Text>
							<Stack gap='xs'>
								{sgRules.optionalSubjectGroups.map((group, idx) => (
									<Paper
										key={idx}
										withBorder
										p='sm'
										bg='var(--mantine-color-dark-7)'
									>
										<Group justify='space-between' mb='xs'>
											<Text size='sm' fw={500}>
												{group.name}
											</Text>
											{group.required && (
												<Badge size='xs' color='red'>
													Required
												</Badge>
											)}
										</Group>
										<Text size='xs' c='dimmed'>
											Min grade: {group.minimumGrade} • Subjects:{' '}
											{group.subjectIds.length}
										</Text>
									</Paper>
								))}
							</Stack>
						</Box>
					)}
			</Stack>
		);
	}

	const classRules = rules as ClassificationRules;
	return (
		<Stack gap='md'>
			<Paper withBorder p='md' bg='var(--mantine-color-dark-7)'>
				<FieldView label='Minimum Classification'>
					<Badge size='lg' color='blue'>
						{classRules.minimumClassification}
					</Badge>
				</FieldView>
			</Paper>

			{classRules.requiredQualificationName && (
				<Paper withBorder p='md' bg='var(--mantine-color-dark-7)'>
					<FieldView label='Required Qualification'>
						<Text>{classRules.requiredQualificationName}</Text>
					</FieldView>
				</Paper>
			)}
		</Stack>
	);
}
