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
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { type GenderType, getGenderColor } from '@/shared/lib/utils/colors';
import { calculateAge, formatDate } from '@/shared/lib/utils/dates';
import CreateApplicationModal from './CreateApplicationModal';

type Props = {
	id: string;
	fullName: string;
	dateOfBirth: string | null;
	nationality: string;
	gender: string;
	nationalId: string | null;
	onDelete: () => void;
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
	const age = calculateAge(dateOfBirth);
	const initials = fullName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<Paper p='lg' radius='md' withBorder>
			<Group justify='space-between' align='flex-start'>
				<Group gap='lg'>
					<Avatar
						size={80}
						radius='xl'
						color={getGenderColor(gender as GenderType)}
						variant='light'
					>
						{initials}
					</Avatar>
					<Stack gap={4}>
						<Title order={2} fw={600}>
							{fullName}
						</Title>
						<Group gap='xs'>
							<Badge
								variant='light'
								color={getGenderColor(gender as GenderType)}
								size='sm'
							>
								{gender}
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
								{nationality}
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
				<Group gap='xs'>
					<CreateApplicationModal applicantId={id} />
					<ActionIcon
						variant='subtle'
						component={Link}
						href={`/admissions/applicants/${id}/edit`}
					>
						<IconEdit size={18} />
					</ActionIcon>
					<ActionIcon variant='subtle' color='red' onClick={onDelete}>
						<IconTrash size={18} />
					</ActionIcon>
				</Group>
			</Group>
		</Paper>
	);
}
