'use client';

import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';
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
	useMantineColorScheme,
} from '@mantine/core';
import {
	IconCalendar,
	IconId,
	IconMapPin,
	IconPhone,
	IconUser,
} from '@tabler/icons-react';

interface Props {
	applicant: ApplicantWithRelations;
}

export function InfoTab({ applicant }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const primaryPhone = applicant.phones?.[0];

	return (
		<Stack gap={40}>
			<Section title='Personal Information'>
				<Paper withBorder radius='md' p='xl'>
					<Grid gutter={30}>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay
								icon={<IconUser size={18} />}
								label='Full Name'
								value={applicant.fullName}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay
								icon={<IconCalendar size={18} />}
								label='Date of Birth'
								value={applicant.dateOfBirth}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay
								icon={<IconId size={18} />}
								label='National ID'
								value={applicant.nationalId}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay label='Nationality' value={applicant.nationality} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay label='Gender' value={applicant.gender} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay
								icon={<IconMapPin size={18} />}
								label='Birth Place'
								value={applicant.birthPlace}
							/>
						</Grid.Col>
					</Grid>
				</Paper>
			</Section>

			<Section title='Contact Information'>
				<Paper withBorder radius='md' p='xl'>
					<Grid gutter={30}>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<FieldDisplay
								icon={<IconPhone size={18} />}
								label='Phone'
								value={primaryPhone?.phoneNumber}
							/>
						</Grid.Col>
						<Grid.Col span={12}>
							<FieldDisplay
								icon={<IconMapPin size={18} />}
								label='Address'
								value={applicant.address}
							/>
						</Grid.Col>
					</Grid>
				</Paper>
			</Section>

			{applicant.guardians.length > 0 && (
				<Section title='Guardian Information'>
					<Stack gap='lg'>
						{applicant.guardians.map((guardian, index) => (
							<Paper key={guardian.id} withBorder radius='md' p='xl'>
								<Stack gap='xl'>
									{applicant.guardians.length > 1 && (
										<Text size='sm' fw={700} c='blue' tt='uppercase'>
											Guardian {index + 1}
										</Text>
									)}
									<Grid gutter={30}>
										<Grid.Col span={{ base: 12, sm: 6 }}>
											<FieldDisplay
												icon={<IconUser size={18} />}
												label='Name'
												value={guardian.name}
											/>
										</Grid.Col>
										<Grid.Col span={{ base: 12, sm: 6 }}>
											<FieldDisplay
												label='Relationship'
												value={guardian.relationship}
											/>
										</Grid.Col>
										<Grid.Col span={{ base: 12, sm: 6 }}>
											<FieldDisplay
												icon={<IconPhone size={18} />}
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
						))}
					</Stack>
				</Section>
			)}

			{applicant.academicRecords.length > 0 && (
				<Section title='Academic Background'>
					<Stack gap='lg'>
						{applicant.academicRecords.map((record) => (
							<Paper key={record.id} withBorder radius='md' p='xl'>
								<Stack gap='md'>
									<Group justify='space-between' align='flex-start'>
										<Stack gap={4}>
											<Text fw={700} size='lg'>
												{record.certificateType.name}
											</Text>
											<Text size='sm' c='dimmed' fw={500}>
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
											<SimpleGrid cols={{ base: 1}} spacing='sm'>
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
		<Stack gap='lg'>
			<Text fw={700} size='20px' style={{ letterSpacing: '-0.5px' }}>
				{title}
			</Text>
			{children}
		</Stack>
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
