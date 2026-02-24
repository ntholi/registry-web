'use client';

import { Box, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import {
	type FieldLabelMap,
	formatFieldName,
	formatValue,
} from '../_lib/audit-utils';

type ChangeItemProps = {
	field: string;
	oldValue: unknown;
	newValue: unknown;
	fieldLabels?: FieldLabelMap;
	operation: string;
};

export default function ChangeItem({
	field,
	oldValue,
	newValue,
	fieldLabels,
	operation,
}: ChangeItemProps) {
	const isInsert = operation === 'INSERT';
	const isDelete = operation === 'DELETE';

	return (
		<Box>
			<Text size='xs' c='dimmed' mb={4}>
				{formatFieldName(field, fieldLabels)}
			</Text>
			<Group gap='xs' wrap='nowrap'>
				{!isInsert && (
					<Text
						size='sm'
						c='red.6'
						td={isDelete ? undefined : 'line-through'}
						style={{ wordBreak: 'break-word' }}
					>
						{formatValue(oldValue)}
					</Text>
				)}
				{!isInsert && !isDelete && (
					<ThemeIcon size='xs' variant='transparent' c='dimmed'>
						<IconArrowRight size={12} />
					</ThemeIcon>
				)}
				{!isDelete && (
					<Text
						size='sm'
						c='green.6'
						fw={500}
						style={{ wordBreak: 'break-word' }}
					>
						{formatValue(newValue)}
					</Text>
				)}
			</Group>
		</Box>
	);
}
