'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { type GenderType, getGenderColor } from '@/shared/lib/utils/colors';
import { calculateAge, formatDate } from '@/shared/lib/utils/dates';
import { DeleteModal } from '@/shared/ui/adease/DeleteModal';
import CreateApplicationModal from './CreateApplicationModal';

type Props = {
	id: string;
	fullName: string;
	dateOfBirth: string | null;
	nationality: string | null;
	gender: string | null;
	nationalId: string | null;
	onDelete: () => Promise<void>;
};

export default function ApplicantHeader({
	id,
	fullName,
	dateOfBirth,
	nationality,
	gender,
	nationalId,
	onDelete,
}: Props) {
	const { data: session } = useSession();
	const isAdmin = session?.user?.role === 'admin';
	const [opened, { open, close }] = useDisclosure(false);
	const age = calculateAge(dateOfBirth);
	const initials = fullName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	const genderColor = gender ? getGenderColor(gender as GenderType) : 'gray';

	return (
		<Paper p='lg' withBorder>
			<Group justify='space-between' align='flex-start'>
				<Group gap='lg'>
					<Avatar size={80} radius='xl' color={genderColor} variant='light'>
						{initials}
					</Avatar>
					<Stack gap={4}>
						<Title order={2} fw={600}>
							{fullName}
						</Title>
						<Group gap='xs'>
							<Badge variant='light' color={genderColor} size='sm'>
								{gender ?? 'Not specified'}
							</Badge>
							{age && (
								<Text size='sm' c='dimmed'>
									{age} years old
								</Text>
							)}
							{dateOfBirth && (
								<Text size='sm' c='dimmed'>
									• Born {formatDate(dateOfBirth, 'long')}
								</Text>
							)}
						</Group>
						<Group gap='xs' mt={4}>
							<Text size='sm' c='dimmed'>
								{nationality ?? 'Not specified'}
							</Text>
							{nationalId && (
								<>
									<Text size='sm' c='dimmed'>
										•
									</Text>
									<Text size='sm' c='dimmed'>
										ID: {nationalId}
									</Text>
								</>
							)}
						</Group>
					</Stack>
				</Group>
				<Stack justify='space-between' align='end'>
					<Group gap='xs'>
						<ActionIcon
							variant='subtle'
							component={Link}
							href={`/admissions/applicants/${id}/edit`}
						>
							<IconEdit size={18} />
						</ActionIcon>
						{isAdmin && (
							<ActionIcon variant='subtle' color='red' onClick={open}>
								<IconTrash size={18} />
							</ActionIcon>
						)}
					</Group>
					<CreateApplicationModal applicantId={id} />
				</Stack>
			</Group>
			<DeleteModal
				opened={opened}
				onClose={close}
				onDelete={onDelete}
				itemName={fullName}
				itemType='Applicant'
			/>
		</Paper>
	);
}
