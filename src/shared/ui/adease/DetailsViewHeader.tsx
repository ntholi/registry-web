'use client';

import { ActionIcon, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type React from 'react';
import {
	hasPermission,
	type PermissionRequirement,
} from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { DeleteButton } from './DeleteButton';

export interface DetailsViewHeaderProps {
	title: React.ReactNode;
	queryKey: string[];
	handleDelete?: () => Promise<void>;
	onDeleteSuccess?: () => Promise<void>;
	deletePermission?: PermissionRequirement;
	editPermission?: PermissionRequirement;
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
	deletePermission,
	editPermission,
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
	const { data: session } = authClient.useSession();
	const pathname = usePathname();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const permissions = session?.permissions ?? [];
	const isAdmin = session?.user?.role === 'admin';
	const canDelete =
		isAdmin ||
		(deletePermission ? hasPermission(permissions, deletePermission) : false);
	const canEdit =
		isAdmin ||
		(editPermission ? hasPermission(permissions, editPermission) : false);
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
						{typeof title === 'string' ? (
							<Title order={3} fw={100}>
								{title}
							</Title>
						) : (
							title
						)}
					</Group>
				) : (
					<Title order={3} fw={100}>
						{title}
					</Title>
				)}
				<Group>
					{handleDelete && canDelete && (
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
					{!hideEdit && canEdit && (
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
