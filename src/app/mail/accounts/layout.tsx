'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { getMailAccounts } from '../accounts/_server/actions';

export default function AccountsLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/mail/accounts'
			queryKey={['mail-accounts']}
			getData={getMailAccounts}
			renderItem={(account) => (
				<ListItem
					id={account.id}
					label={account.email}
					description={account.displayName}
					rightSection={
						<Group gap={4}>
							{account.isPrimary && (
								<Badge size='xs' variant='light'>
									Primary
								</Badge>
							)}
							<Badge
								size='xs'
								variant='light'
								color={account.isActive ? 'green' : 'gray'}
							>
								{account.isActive ? 'Active' : 'Inactive'}
							</Badge>
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
