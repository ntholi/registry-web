'use client';

import {
	Badge,
	Box,
	Divider,
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
		<Paper h='100%' radius='md' shadow='sm' withBorder>
			<Box p='xl' pb='lg'>
				<Badge size='lg' mb='md'>
					{program.level}
				</Badge>
				<Title order={3} mb='xs'>
					{program.name}
				</Title>
				<Text c='dimmed'>{program.school.name}</Text>
			</Box>

			<Divider />

			<Box p='xl'>
				{!rules ? (
					<Text c='dimmed'>Entry requirements coming soon.</Text>
				) : (
					<Stack gap='xl'>
						<Box>
							<Title order={5} mb='sm'>
								What you need to qualify
							</Title>
							<Text size='lg'>
								You must pass at least{' '}
								<Text span fw={700} c='teal'>
									{rules.minimumGrades.count} subjects
								</Text>{' '}
								with a grade of{' '}
								<Text span fw={700} c='teal'>
									{rules.minimumGrades.grade}
								</Text>{' '}
								or better in your LGCSE results.
							</Text>
						</Box>

						{rules.requiredSubjects.length > 0 && (
							<Box>
								<Title order={5} mb='sm'>
									Subjects you must pass
								</Title>
								<Text mb='md' c='dimmed'>
									You need to pass these specific subjects:
								</Text>
								<List
									spacing='sm'
									icon={
										<IconCheck
											size={18}
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

						{rules.optionalSubjectGroups &&
							rules.optionalSubjectGroups.length > 0 && (
								<Box>
									<Title order={5} mb='sm'>
										Choose from these subject groups
									</Title>
									<Text mb='md' c='dimmed'>
										Pick subjects from the following groups:
									</Text>
									<Stack gap='md'>
										{rules.optionalSubjectGroups.map((group, idx) => (
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

						{rules.alternatives && rules.alternatives.length > 0 && (
							<Box>
								<Title order={5} mb='sm'>
									Another way to qualify
								</Title>
								<Text mb='md' c='dimmed'>
									If you don't meet the requirements above, you can also qualify
									this way:
								</Text>
								<Stack gap='md'>
									{rules.alternatives.map((alt, idx) => (
										<Paper
											key={idx}
											p='md'
											radius='md'
											bg='var(--mantine-color-yellow-light)'
										>
											<Text mb='sm'>
												Pass{' '}
												<Text span fw={700}>
													{alt.minimumGrades.count} subjects
												</Text>{' '}
												with grade{' '}
												<Text span fw={700}>
													{alt.minimumGrades.grade}
												</Text>{' '}
												or better.
											</Text>
											{alt.requiredSubjects.length > 0 && (
												<>
													<Text size='sm' c='dimmed' mb='xs'>
														Including these subjects:
													</Text>
													<List size='sm' spacing='xs'>
														{alt.requiredSubjects.map((sub, subIdx) => (
															<List.Item key={subIdx}>
																{subjectMap.get(sub.subjectId) || sub.subjectId}{' '}
																(grade {sub.minimumGrade})
															</List.Item>
														))}
													</List>
												</>
											)}
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
