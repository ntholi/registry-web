import {
	Accordion,
	Alert,
	Group,
	LoadingOverlay,
	Stack,
	Text,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { StudentModuleStatus } from '@/core/database';
import { MAX_REG_MODULES } from '@/modules/registry/shared/constants';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import ModuleCheckbox from './ModuleCheckbox';

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

type SelectedModule = {
	moduleId: number;
	moduleStatus: StudentModuleStatus;
};

interface ModuleSelectionProps {
	modules: ModuleWithStatus[];
	selectedModules: SelectedModule[];
	onSelectionChange: (modules: SelectedModule[]) => void;
	loading: boolean;
}

export default function ModuleSelection({
	modules,
	selectedModules,
	onSelectionChange,
	loading,
}: ModuleSelectionProps) {
	const handleModuleToggle = (module: ModuleWithStatus, checked: boolean) => {
		if (checked) {
			const newModule: SelectedModule = {
				moduleId: module.semesterModuleId,
				moduleStatus:
					module.status === 'Compulsory'
						? 'Compulsory'
						: module.status === 'Elective'
							? 'Compulsory'
							: module.status.startsWith('Repeat')
								? 'Repeat1'
								: 'Compulsory',
			};
			onSelectionChange([...selectedModules, newModule]);
		} else {
			onSelectionChange(
				selectedModules.filter(
					(selected) => selected.moduleId !== module.semesterModuleId
				)
			);
		}
	};

	const isModuleSelected = (moduleId: number) => {
		return selectedModules.some((selected) => selected.moduleId === moduleId);
	};

	if (loading) {
		return (
			<div style={{ position: 'relative', minHeight: 200 }}>
				<LoadingOverlay visible />
			</div>
		);
	}

	if (modules.length === 0) {
		return (
			<Alert
				icon={<IconInfoCircle size='1rem' />}
				title='No Modules Available'
				color='orange'
			>
				No modules are available for registration at this time.
			</Alert>
		);
	}

	const compulsoryModules = modules.filter((m) => m.status === 'Compulsory');
	const electiveModules = modules.filter((m) => m.status === 'Elective');
	const repeatModules = modules.filter((m) => m.status.startsWith('Repeat'));

	return (
		<Stack gap='lg' mt='md'>
			<Accordion
				multiple
				defaultValue={['compulsory', 'elective', 'repeat']}
				variant='separated'
			>
				{compulsoryModules.length > 0 && (
					<Accordion.Item value='compulsory'>
						<Accordion.Control>
							<Group justify='space-between'>
								<Text fw={500}>Compulsory Modules</Text>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='sm'>
								{compulsoryModules.map((module) => (
									<ModuleCheckbox
										key={module.semesterModuleId}
										module={module}
										isSelected={isModuleSelected(module.semesterModuleId)}
										onToggle={(checked: boolean) =>
											handleModuleToggle(module, checked)
										}
									/>
								))}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				)}

				{electiveModules.length > 0 && (
					<Accordion.Item value='elective'>
						<Accordion.Control>
							<Group justify='space-between'>
								<Text fw={500}>Elective Modules</Text>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='sm'>
								{electiveModules.map((module) => (
									<ModuleCheckbox
										key={module.semesterModuleId}
										module={module}
										isSelected={isModuleSelected(module.semesterModuleId)}
										onToggle={(checked: boolean) =>
											handleModuleToggle(module, checked)
										}
									/>
								))}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				)}

				{repeatModules.length > 0 && (
					<Accordion.Item value='repeat'>
						<Accordion.Control>
							<Group justify='space-between'>
								<Text fw={500}>Repeat Modules</Text>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='sm'>
								{repeatModules.map((module) => (
									<ModuleCheckbox
										key={module.semesterModuleId}
										module={module}
										isSelected={isModuleSelected(module.semesterModuleId)}
										onToggle={(checked: boolean) =>
											handleModuleToggle(module, checked)
										}
									/>
								))}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				)}
			</Accordion>

			{selectedModules.length > 0 && (
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					color={getBooleanColor(
						selectedModules.length > MAX_REG_MODULES,
						'negative'
					)}
				>
					You have selected {selectedModules.length} module
					{selectedModules.length !== 1 ? 's' : ''}
					for registration.
					{selectedModules.length > MAX_REG_MODULES && (
						<Text size='sm' mt='xs'>
							Maximum allowed modules: {MAX_REG_MODULES}. Please deselect{' '}
							{selectedModules.length - MAX_REG_MODULES} module
							{selectedModules.length - MAX_REG_MODULES !== 1 ? 's' : ''} to
							continue.
						</Text>
					)}
				</Alert>
			)}
		</Stack>
	);
}
