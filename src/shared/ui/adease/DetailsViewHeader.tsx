'use client';

import { ActionIcon, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/core/database';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { DeleteButton } from './DeleteButton';

export interface DetailsViewHeaderProps {
	title: string;
	queryKey: string[];
	handleDelete?: () => Promise<void>;
	onDeleteSuccess?: () => Promise<void>;
	deleteRoles?: UserRole[];
	editRoles?: UserRole[];
	hideEdit?: boolean;
	message?: string;
	itemName?: string;
	itemType?: string;
	warningMessage?: string;
	deleteTitle?: string;
	typedConfirmation?: boolean;
	confirmationText?: string;
	confirmButtonText?: string;
}

export function DetailsViewHeader({
	title,
	queryKey,
	handleDelete,
	onDeleteSuccess,
	deleteRoles,
	editRoles,
	hideEdit,
	message,
	itemName,
	itemType,
	warningMessage,
	deleteTitle,
	typedConfirmation,
	confirmationText,
	confirmButtonText,
}: DetailsViewHeaderProps) {
	const { data: session } = useSession();
	const pathname = usePathname();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const searchParams = useSearchParams();
	const newSearchParams = new URLSearchParams(searchParams);
	newSearchParams.set('view', 'details');

	return (
		<>
			<Flex justify={'space-between'} align={'center'}>
				{isMobile ? (
					<Group>
						<ActionIcon variant='default' onClick={() => setView('nav')}>
							<IconArrowNarrowLeft size={'1rem'} />
						</ActionIcon>
						<Title order={3} fw={100} size={'1rem'}>
							{title}
						</Title>
					</Group>
				) : (
					<Title order={3} fw={100}>
						{title}
					</Title>
				)}
				<Group>
					{handleDelete &&
						([...(deleteRoles ?? []), 'admin'].includes(
							session?.user?.role ?? ''
						) as boolean) && (
							<DeleteButton
								handleDelete={handleDelete}
								onSuccess={onDeleteSuccess}
								queryKey={queryKey}
								message={message}
								itemName={itemName}
								itemType={itemType}
								warningMessage={warningMessage}
								title={deleteTitle}
								typedConfirmation={typedConfirmation}
								confirmationText={confirmationText}
								confirmButtonText={confirmButtonText}
							/>
						)}
					{!hideEdit &&
						[...(editRoles ?? []), 'admin'].includes(
							session?.user?.role ?? ''
						) && (
							<ActionIcon
								component={Link}
								href={`${pathname}/edit?${newSearchParams.toString()}`}
								variant='outline'
							>
								<IconEdit size={'1rem'} />
							</ActionIcon>
						)}
				</Group>
			</Flex>
			<Divider my={15} />
		</>
	);
}
