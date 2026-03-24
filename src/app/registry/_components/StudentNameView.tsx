'use client';

import { ActionIcon, Flex, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';

export default function StudentNameView({
	stdNo,
	name,
}: {
	stdNo: number;
	name: string;
}) {
	return (
		<FieldView label='Student' underline={false}>
			<Flex align='center' gap='xs'>
				<Link href={`/registry/students/${stdNo}`} size='sm' fw={500}>
					{name} ({stdNo})
				</Link>
				<Tooltip label='Copy student number'>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='sm'
						onClick={() => {
							navigator.clipboard.writeText(String(stdNo));
							notifications.show({
								message: 'Student number copied to clipboard',
								color: 'green',
							});
						}}
					>
						<IconCopy size={16} />
					</ActionIcon>
				</Tooltip>
			</Flex>
		</FieldView>
	);
}
