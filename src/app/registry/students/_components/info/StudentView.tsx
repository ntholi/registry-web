'use client';

import { EditStudentModal } from '@audit-logs/students';
import {
	ActionIcon,
	Badge,
	Box,
	Card,
	CopyButton,
	Flex,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/core/database';
import { getBooleanColor, getStatusColor } from '@/shared/lib/utils/colors';
import { calculateAge, formatDate } from '@/shared/lib/utils/dates';
import { formatPhoneNumber, formatSemester } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import type { getStudent } from '../../_server/actions';
import EditStudentUserModal from '../academics/EditStudentUserModal';
import AcademicSummary from './AcademicSummary';
import EditStructureModal from './EditStructureModal';
import PhotoView from './PhotoView';

type Props = {
	student: Awaited<ReturnType<typeof getStudent>>;
};

export default function StudentView({ student }: Props) {
	const { data: session } = useSession();
	if (!student) return null;

	const activePrograms = student.programs?.filter((p) =>
		['Active', 'Completed'].includes(p.status)
	);

	const getLatestSemesterNumber = () => {
		if (!activePrograms || activePrograms.length === 0) return null;

		let latestSemesterId = 0;
		let latestSemesterNumber = null;

		activePrograms.forEach((program) => {
			if (program.semesters) {
				program.semesters.forEach((semester) => {
					if (semester.id > latestSemesterId) {
						latestSemesterId = semester.id;
						latestSemesterNumber = semester.structureSemester?.semesterNumber;
					}
				});
			}
		});

		return latestSemesterNumber;
	};

	const latestSemester = getLatestSemesterNumber();

	return (
		<Stack gap='xl'>
			<Group gap='xs' align='stretch'>
				<PhotoView student={student} />
				<Card withBorder flex={1} p='md' h={76}>
					<Group wrap='nowrap' gap='xs'>
						<div style={{ flex: 1 }}>
							<Text size='sm' c='dimmed'>
								User
							</Text>
							{student.user ? (
								<Link
									href={`/admin/users/${student.user?.id}`}
									size='sm'
									fw={500}
								>
									{student.user?.email}
								</Link>
							) : (
								<Text size='sm' c='dimmed'>
									No user assigned
								</Text>
							)}
						</div>
						{student.user && (
							<Tooltip label='Copy'>
								<ActionIcon
									variant='subtle'
									color='gray'
									onClick={() => {
										navigator.clipboard.writeText(String(student.user?.email));
										notifications.show({
											message: 'Copied to clipboard',
											color: 'green',
										});
									}}
								>
									<IconCopy size={16} />
								</ActionIcon>
							</Tooltip>
						)}
						{session?.user?.role &&
							(['admin', 'registry'] as UserRole[]).includes(
								session.user.role
							) && (
								<EditStudentUserModal
									studentStdNo={student.stdNo}
									currentUser={student.user}
								/>
							)}
					</Group>
				</Card>
			</Group>

			<div>
				<Flex justify='space-between'>
					<Group gap='lg' align='center' mb='xs'>
						<Title order={4} fw={100}>
							Student
						</Title>
						{session?.user?.role &&
							(['admin', 'registry'] as UserRole[]).includes(
								session.user.role
							) && <EditStudentModal student={student} />}
					</Group>
					<Badge
						radius='sm'
						color={getStatusColor(student.status)}
						variant='light'
					>
						{student.status}
					</Badge>
				</Flex>
				<Paper p='md' radius='md' withBorder>
					<Grid gutter='xl'>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Student Number' value={student.stdNo} copyable />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Full Name' value={student.name} copyable />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='National ID' value={student.nationalId} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem
								label='Date of Birth'
								value={`${formatDate(student.dateOfBirth)} • ${calculateAge(student.dateOfBirth)} Years`}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Gender' value={student.gender} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Marital Status' value={student.maritalStatus} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Country' value={student.country} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Birth Place' value={student.birthPlace} />
						</Grid.Col>
					</Grid>
				</Paper>
			</div>

			{activePrograms && activePrograms.length > 0 && (
				<div>
					<Flex justify='space-between'>
						<Title order={4} mb='xs' fw={100}>
							Program
						</Title>
						<Badge
							radius={'sm'}
							color={getStatusColor(activePrograms[0].status)}
							variant='light'
						>
							{activePrograms[0].status}
						</Badge>
					</Flex>
					<Paper p='md' radius='md' withBorder>
						<Grid gutter='xl'>
							<Grid.Col span={{ base: 12 }}>
								<Group>
									<InfoItem
										label='Program/Class'
										value={activePrograms[0].structure.program.name}
										displayValue={`${activePrograms[0].structure.program.name} (${activePrograms[0].structure.program.code}${formatSemester(latestSemester, 'mini')})`}
									/>
								</Group>
							</Grid.Col>

							<Grid.Col span={{ base: 12, sm: 6 }}>
								<InfoItem
									label='Intake Date'
									value={activePrograms[0].intakeDate}
								/>
							</Grid.Col>
							<Grid.Col span={{ base: 12, sm: 3 }}>
								<InfoItem
									label='Graduation Date'
									value={activePrograms[0].graduationDate}
								/>
							</Grid.Col>
							<Grid.Col span={{ base: 12, sm: 3 }}>
								<Flex justify='flex-end' gap='xs'>
									<InfoItem
										label='Structure'
										value={activePrograms[0].structure.code}
										href={`/academic/schools/structures/${activePrograms[0].structureId}`}
										copyable={false}
									/>
									{session?.user?.role &&
										(['admin', 'registry'] as UserRole[]).includes(
											session.user.role
										) && (
											<Box pt={15}>
												<EditStructureModal
													stdNo={student.stdNo}
													programId={activePrograms[0].structure.programId}
													currentStructureId={activePrograms[0].structureId}
													currentStructureCode={
														activePrograms[0].structure.code
													}
												/>
											</Box>
										)}
								</Flex>
							</Grid.Col>
						</Grid>
					</Paper>
				</div>
			)}

			{student && <AcademicSummary student={student} />}

			<div>
				<Title order={4} mb='xs' fw={100}>
					Contact Information
				</Title>
				<Paper p='md' radius='md' withBorder>
					<Grid gutter='xl'>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem
								label='Primary Phone'
								href={`tel:${stripPhoneNumber(formatPhoneNumber(student.phone1))}`}
								displayValue={formatPhoneNumber(student.phone1)}
								value={stripPhoneNumber(formatPhoneNumber(student.phone1))}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem
								label='Secondary Phone'
								href={`tel:${stripPhoneNumber(formatPhoneNumber(student.phone2))}`}
								displayValue={formatPhoneNumber(student.phone2)}
								value={stripPhoneNumber(formatPhoneNumber(student.phone2))}
							/>
						</Grid.Col>
					</Grid>
				</Paper>
			</div>

			{student.nextOfKins && student.nextOfKins.length > 0 && (
				<div>
					<Title order={4} mb='xs' fw={100}>
						Next of Kin
					</Title>
					<Stack gap='md'>
						{student.nextOfKins.map((kin) => (
							<Paper key={kin.id} p='md' radius='md' withBorder>
								<Grid gutter='xl'>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<InfoItem label='Name' value={kin.name} />
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<InfoItem label='Relationship' value={kin.relationship} />
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<InfoItem
											label='Phone'
											href={
												kin.phone
													? `tel:${stripPhoneNumber(kin.phone)}`
													: undefined
											}
											displayValue={
												kin.phone ? formatPhoneNumber(kin.phone) : undefined
											}
											value={
												kin.phone ? stripPhoneNumber(kin.phone) : undefined
											}
										/>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<InfoItem
											label='Email'
											href={kin.email ? `mailto:${kin.email}` : undefined}
											value={kin.email}
										/>
									</Grid.Col>
								</Grid>
							</Paper>
						))}
					</Stack>
				</div>
			)}
		</Stack>
	);
}

function InfoItem({
	label,
	value,
	href,
	displayValue,
	copyable = true,
}: {
	label: string;
	value: number | string | null | undefined;
	href?: string;
	displayValue?: string | null;
	copyable?: boolean;
}) {
	return (
		<Box
			style={{
				position: 'relative',
			}}
			onMouseEnter={(e) => {
				const copyButton = e.currentTarget.querySelector(
					'.copy-button'
				) as HTMLElement;
				if (copyButton) copyButton.style.opacity = '1';
			}}
			onMouseLeave={(e) => {
				const copyButton = e.currentTarget.querySelector(
					'.copy-button'
				) as HTMLElement;
				if (copyButton) copyButton.style.opacity = '0';
			}}
		>
			<Text size='sm' c='dimmed'>
				{label}
			</Text>
			<Group>
				{href ? (
					<Link href={href} size='sm' fw={500}>
						{displayValue ?? value ?? 'N/A'}
					</Link>
				) : (
					<Text size='sm' fw={500}>
						{displayValue ?? value ?? 'N/A'}
					</Text>
				)}
				{copyable && value && (
					<CopyButton value={String(value)}>
						{({ copied, copy }) => (
							<Tooltip label={copied ? 'Copied' : 'Copy'}>
								<ActionIcon
									variant='subtle'
									color={getBooleanColor(copied, 'highlight')}
									onClick={copy}
									className='copy-button'
									style={{
										opacity: 0,
										transition: 'opacity 0.2s ease',
									}}
								>
									{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
								</ActionIcon>
							</Tooltip>
						)}
					</CopyButton>
				)}
			</Group>
		</Box>
	);
}

function stripPhoneNumber(phone: string | null | undefined) {
	if (!phone) return '';
	return phone
		.replaceAll(' ', '')
		.replaceAll('-', '')
		.replaceAll('(', '')
		.replaceAll(')', '');
}
