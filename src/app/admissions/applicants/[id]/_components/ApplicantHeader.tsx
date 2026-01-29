'use client';

import { ActionIcon, Avatar, Group, Paper, Stack, Title } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { users } from '@/core/database';
import { type GenderType, getGenderColor } from '@/shared/lib/utils/colors';
import { DeleteButton } from '@/shared/ui/adease/DeleteButton';
import { deleteApplicant } from '../../_server/actions';
import ApplicantEmailModal from './ApplicantEmailModal';
import CreateApplicationModal from './CreateApplicationModal';

type User = typeof users.$inferSelect;

type Props = {
	id: string;
	fullName: string;
	gender: string | null;
	user: User | null;
};

export default function ApplicantHeader({ id, fullName, gender, user }: Props) {
	const { data: session } = useSession();
	const canDelete = session?.user?.role === 'admin';
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
					<Avatar
						src={user?.image}
						size={80}
						radius={80}
						color={genderColor}
						variant='light'
					>
						{initials}
					</Avatar>
					<Stack gap={4}>
						<Title order={2} fw={600}>
							{fullName}
						</Title>
						<Group gap='xs' mt={4}>
							<ApplicantEmailModal applicantId={id} currentUser={user} />
						</Group>
					</Stack>
				</Group>
				<Stack justify='space-between' align='end'>
					<Group gap='xs'>
						<ActionIcon
							variant='subtle'
							color='gray'
							component={Link}
							href={`/admissions/applicants/${id}/edit`}
						>
							<IconEdit size={18} />
						</ActionIcon>
						{canDelete && (
							<DeleteButton
								handleDelete={async () => {
									await deleteApplicant(id);
								}}
								itemName={fullName}
								itemType='Applicant'
							/>
						)}
					</Group>
					<CreateApplicationModal applicantId={id} />
				</Stack>
			</Group>
		</Paper>
	);
}
