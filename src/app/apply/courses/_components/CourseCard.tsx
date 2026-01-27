'use client';

import {
	Badge,
	Box,
	Divider,
	Flex,
	Group,
	List,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
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
		<Paper h='100%' radius='md' pb={'lg'} shadow='sm' withBorder>
			<Box px='xl' py={'lg'} w={'100%'}>
				<Flex justify='space-between' align='center'>
					<Text>{program.school.shortName}</Text>
					<Badge size='sm' variant='light' radius={'xs'}>
						{program.level}
					</Badge>
				</Flex>
				<Title order={3}>{program.name}</Title>
				<Text c='dimmed' size='xs'>
					{program.school.name}
				</Text>
			</Box>

			<Divider my={'xs'} />

			<Box px='xl' py={'sm'} w={'100%'}>
				{!rules ? (
					<Text c='dimmed'>Entry requirements coming soon.</Text>
				) : (
					<Stack gap='xl'>
						<Box>
							<Title size={'xs'} order={5} mb='sm'>
								Entry Requirements
							</Title>
							<Text>
								{rules.minimumGrades.map((mg, idx) => (
									<span key={idx}>
										{idx === 0 ? 'You must pass at least ' : ' and '}
										<Text span fw={700} c='teal'>
											{mg.count} subjects
										</Text>{' '}
										with a grade of{' '}
										<Text span fw={700} c='teal'>
											{mg.grade}
										</Text>{' '}
										or better
										{idx === rules.minimumGrades.length - 1 ? '.' : ''}
									</span>
								))}
							</Text>
						</Box>

						{rules.requiredSubjects.length > 0 && (
							<Box>
								<Title size={'xs'} order={5} mb='sm'>
									Required Subjects
								</Title>
								<List
									spacing='sm'
									icon={
										<IconCheck
											size={16}
											color='var(--mantine-color-teal-filled)'
										/>
									}
								>
									{rules.requiredSubjects.map((sub, idx) => (
										<List.Item key={idx}>
											<Group gap='xs' wrap='nowrap'>
												<Text fw={500}>
													{subjectMap.get(sub.subjectId) || sub.subjectId}
												</Text>
												<Text c='dimmed'>—</Text>
												<Text c='dimmed'>minimum grade {sub.minimumGrade}</Text>
											</Group>
										</List.Item>
									))}
								</List>
							</Box>
						)}

						{rules.subjectGroups && rules.subjectGroups.length > 0 && (
							<Box>
								<Title size={'xs'} order={5} mb='sm'>
									Additional Requirements
								</Title>
								<Stack gap='md'>
									{rules.subjectGroups.map((group, idx) => (
										<Paper key={idx} p='md' radius='md' withBorder>
											<Group justify='space-between' mb='xs'>
												<Text fw={600}>{group.name}</Text>
												{group.required && (
													<Badge color='red' size='sm'>
														Required
													</Badge>
												)}
											</Group>
											<Text size='sm' mb='xs'>
												Minimum grade needed:{' '}
												<Text span fw={600}>
													{group.minimumGrade}
												</Text>
											</Text>
											<Text size='sm' c='dimmed'>
												Subjects:{' '}
												{group.subjectIds
													.map((id) => subjectMap.get(id) || id)
													.join(', ')}
											</Text>
										</Paper>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				)}
			</Box>
		</Paper>
	);
}
