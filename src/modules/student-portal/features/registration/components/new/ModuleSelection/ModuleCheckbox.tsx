import { Badge, Checkbox, Flex, Group, Text } from '@mantine/core';
import { getModuleTypeColor } from '@student-portal/utils';
import { IconLock } from '@tabler/icons-react';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

interface ModuleCheckboxProps {
	module: ModuleWithStatus;
	isSelected: boolean;
	onToggle: (checked: boolean) => void;
}

export default function ModuleCheckbox({
	module,
	isSelected,
	onToggle,
}: ModuleCheckboxProps) {
	function hasPrerequisites(module: ModuleWithStatus) {
		return (
			module.prerequisites !== undefined && module.prerequisites.length > 0
		);
	}

	const hasPrereqs = hasPrerequisites(module);
	const isDisabled = hasPrereqs;

	if (isDisabled) {
		return (
			<Checkbox.Card radius='md' p='md' style={{ opacity: 0.5 }}>
				<Group wrap='nowrap' align='flex-start'>
					<IconLock size={20} />
					<div style={{ flex: 1 }}>
						<Flex gap='xs'>
							<Text fw={500} c='dimmed' ff='monospace'>
								{module.code}
							</Text>
						</Flex>
						<Text size='sm' c='dimmed'>
							{module.name}
						</Text>
						<Text size='xs' c='red' mt={2}>
							Failed Prerequisites:{' '}
							{module.prerequisites?.map((p) => p.code).join(', ')}
						</Text>
					</div>
				</Group>
			</Checkbox.Card>
		);
	}

	return (
		<Checkbox.Card
			radius='md'
			checked={isSelected}
			onClick={() => onToggle(!isSelected)}
			p='md'
			withBorder
		>
			<Group wrap='nowrap' align='flex-start'>
				<Checkbox.Indicator />
				<div style={{ flex: 1 }}>
					<Flex gap='xs' align='center' justify='space-between' mb='xs'>
						<Text fw={500} ff='monospace'>
							{module.code}
						</Text>
						<Badge
							color={getModuleTypeColor(module.status)}
							size='sm'
							variant='light'
						>
							{module.status}
						</Badge>
					</Flex>
					<Text size='sm' mb='xs'>
						{module.name}
					</Text>
				</div>
			</Group>
		</Checkbox.Card>
	);
}
