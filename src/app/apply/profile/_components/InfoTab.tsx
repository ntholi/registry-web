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
	ThemeIcon,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import {
	IconCalendar,
	IconId,
	IconMapPin,
	IconPhone,
	IconUser,
} from '@tabler/icons-react';
import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';

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
						<FieldDisplay label='Full Name' value={applicant.fullName} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Date of Birth' value={applicant.dateOfBirth} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='National ID' value={applicant.nationalId} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Nationality' value={applicant.nationality} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Gender' value={applicant.gender} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay label='Birth Place' value={applicant.birthPlace} />
					</Grid.Col>
				</Grid>
			</Paper>

			<Section title='Contact Information'>
				<Paper withBorder radius='md' p='xl'>
					<Grid>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay label='Phone' value={primaryPhone?.phoneNumber} />
						</Grid.Col>
						<Grid.Col span={12}>
							<FieldDisplay label='Address' value={applicant.address} />
						</Grid.Col>
					</Grid>
				</Paper>
			</Section>

			{applicant.guardians.length > 0 && (
				<Section title='Guardian Information'>
					<Stack gap='lg'>
						{applicant.guardians.map((guardian, index) => (
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<Paper key={guardian.id} withBorder radius='md' p='xl'>
									<Stack gap='xl'>
										{applicant.guardians.length > 1 && (
											<Text size='sm' fw={700} c='blue' tt='uppercase'>
												Guardian {index + 1}
											</Text>
										)}
										<Grid>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldDisplay label='Name' value={guardian.name} />
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldDisplay
													label='Relationship'
													value={guardian.relationship}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldDisplay
													label='Phone'
													value={guardian.phones?.[0]?.phoneNumber}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<FieldDisplay
													label='Occupation'
													value={guardian.occupation}
												/>
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

interface FieldDisplayProps {
	icon?: React.ReactNode;
	label: string;
	value?: string | null;
}

function FieldDisplay({ icon, label, value }: FieldDisplayProps) {
	return (
		<Stack gap={4}>
			<Group gap='xs'>
				{icon && (
					<ThemeIcon size='xs' variant='transparent' c='dimmed'>
						{icon}
					</ThemeIcon>
				)}
				<Text size='xs' c='dimmed'>
					{label}
				</Text>
			</Group>
			{value ? (
				<Text size='sm' fw={500}>
					{value}
				</Text>
			) : (
				<Badge size='xs' variant='light' color='gray'>
					Not provided
				</Badge>
			)}
		</Stack>
	);
}
