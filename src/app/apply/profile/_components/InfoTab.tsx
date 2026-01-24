'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import { Badge, Grid, Group, Stack, Text, ThemeIcon } from '@mantine/core';
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
	const primaryPhone = applicant.phones?.[0];

	return (
		<Stack gap='xl'>
			<Section title='Personal Information'>
				<Grid gutter='md'>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconUser size={16} />}
							label='Full Name'
							value={applicant.fullName}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconCalendar size={16} />}
							label='Date of Birth'
							value={applicant.dateOfBirth}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconId size={16} />}
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
							icon={<IconMapPin size={16} />}
							label='Birth Place'
							value={applicant.birthPlace}
						/>
					</Grid.Col>
				</Grid>
			</Section>

			<Section title='Contact Information'>
				<Grid gutter='md'>
					<Grid.Col span={{ base: 12, sm: 6 }}>
						<FieldDisplay
							icon={<IconPhone size={16} />}
							label='Phone'
							value={primaryPhone?.phoneNumber}
						/>
					</Grid.Col>
					<Grid.Col span={12}>
						<FieldDisplay
							icon={<IconMapPin size={16} />}
							label='Address'
							value={applicant.address}
						/>
					</Grid.Col>
				</Grid>
			</Section>

			{applicant.guardians.length > 0 && (
				<Section title='Guardian Information'>
					<Stack gap='lg'>
						{applicant.guardians.map((guardian, index) => (
							<Stack key={guardian.id} gap='md'>
								{applicant.guardians.length > 1 && (
									<Text size='sm' fw={500} c='dimmed'>
										Guardian {index + 1}
									</Text>
								)}
								<Grid gutter='md'>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<FieldDisplay
											icon={<IconUser size={16} />}
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
											icon={<IconPhone size={16} />}
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
						))}
					</Stack>
				</Section>
			)}

			{applicant.academicRecords.length > 0 && (
				<Section title='Academic Background'>
					<Stack gap='lg'>
						{applicant.academicRecords.map((record) => (
							<Stack key={record.id} gap='xs'>
								<Group gap='xs'>
									<Text fw={500}>{record.certificateType.name}</Text>
									<Badge size='sm' variant='light'>
										LQF Level {record.certificateType.lqfLevel}
									</Badge>
								</Group>
								<Text size='sm' c='dimmed'>
									{record.institutionName}
								</Text>
								{record.subjectGrades.length > 0 && (
									<Group gap='xs' mt='xs'>
										{record.subjectGrades.slice(0, 5).map((grade) => (
											<Badge key={grade.id} variant='outline' size='sm'>
												{grade.subject.name}: {grade.standardGrade}
											</Badge>
										))}
										{record.subjectGrades.length > 5 && (
											<Badge variant='light' size='sm' color='gray'>
												+{record.subjectGrades.length - 5} more
											</Badge>
										)}
									</Group>
								)}
							</Stack>
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
		<Stack gap='md'>
			<Text fw={600} size='lg'>
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
