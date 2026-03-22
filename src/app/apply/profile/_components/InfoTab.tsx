'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import {
	Badge,
	Box,
	Grid,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import { getGradeColor } from '@/shared/lib/utils/colors';
import { FieldView } from '@/shared/ui/adease/FieldView';

interface Props {
	applicant: ApplicantWithRelations;
}

export function InfoTab({ applicant }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const primaryPhone = applicant.phones?.[0];

	return (
		<Stack gap={40}>
			<Paper withBorder radius='md' p='xl'>
				<Grid>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='Full Name'>{applicant.fullName}</FieldView>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='Date of Birth'>{applicant.dateOfBirth}</FieldView>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='National ID'>{applicant.nationalId}</FieldView>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='Nationality'>{applicant.nationality}</FieldView>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='Gender'>{applicant.gender}</FieldView>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldView label='Birth Place'>{applicant.birthPlace}</FieldView>
					</Grid.Col>
				</Grid>
			</Paper>

			<Section title='Contact Information'>
				<Paper withBorder radius='md' p='xl'>
					<Grid>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldView label='Phone'>{primaryPhone?.phoneNumber}</FieldView>
						</Grid.Col>
						<Grid.Col span={12}>
							<FieldView label='Address'>{applicant.address}</FieldView>
						</Grid.Col>
					</Grid>
				</Paper>
			</Section>

			{applicant.guardians.length > 0 && (
				<Section title='Guardian Information'>
					<Stack gap='lg'>
						{applicant.guardians.map((guardian, index) => (
							<SimpleGrid key={guardian.id} cols={{ base: 1, sm: 2 }}>
								<Paper withBorder radius='md' p='xl'>
									<Stack gap='xl'>
										{applicant.guardians.length > 1 && (
											<Text size='sm' fw={700} c='blue' tt='uppercase'>
												Guardian {index + 1}
											</Text>
										)}
										<Grid>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldView label='Name'>{guardian.name}</FieldView>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldView label='Relationship'>
													{guardian.relationship}
												</FieldView>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldView label='Phone'>
													{guardian.phones?.[0]?.phoneNumber}
												</FieldView>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldView label='Occupation'>
													{guardian.occupation}
												</FieldView>
											</Grid.Col>
										</Grid>
									</Stack>
								</Paper>
							</SimpleGrid>
						))}
					</Stack>
				</Section>
			)}

			{applicant.academicRecords.length > 0 && (
				<Section title='Academic Background'>
					<Stack gap='lg'>
						{applicant.academicRecords.map((record) => (
							<Paper key={record.id} withBorder radius='md' p='xl'>
								<Stack gap={2}>
									<Group justify='space-between' align='flex-start'>
										<Stack gap={4}>
											<Text>{record.certificateType.name}</Text>
											<Text size='xs' c='dimmed'>
												{record.institutionName}
											</Text>
										</Stack>
									</Group>

									{record.subjectGrades.length > 0 && (
										<Box
											mt='md'
											p='md'
											bg={isDark ? 'dark.8' : 'gray.0'}
											style={{ borderRadius: '8px' }}
										>
											<SimpleGrid cols={{ base: 1 }} spacing='sm'>
												{record.subjectGrades.map((grade) => (
													<Group key={grade.id}>
														<Text
															size='xs'
															fw={600}
															truncate
															style={{ flex: 1 }}
														>
															{grade.subject.name}
														</Text>
														<Badge
															size='sm'
															variant='light'
															color={getGradeColor(grade.standardGrade)}
														>
															{grade.standardGrade}
														</Badge>
													</Group>
												))}
											</SimpleGrid>
										</Box>
									)}
								</Stack>
							</Paper>
						))}
					</Stack>
				</Section>
			)}
		</Stack>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Box>
			<Title order={4} fw={500} mb={'sm'}>
				{title}
			</Title>
			{children}
		</Box>
	);
}
