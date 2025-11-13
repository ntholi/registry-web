'use client';

import { ActionIcon, Box, Group, Paper } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import type { StudentModuleStatus } from '@/core/db/schema';
import type { getStructureModules } from '@/server/academic/structures/actions';
import { ModuleSearchInput } from './ModuleSearchInput';
import ModulesTable from './ModulesTable';

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

type Student = {
	programs: Array<{
		semesters: Array<{
			studentModules: Array<{
				semesterModule: {
					module: {
						name: string;
					} | null;
				};
			}>;
		}>;
	}>;
};

interface ModuleSectionProps {
	availableModules: ModuleWithStatus[];
	setAvailableModules: (modules: ModuleWithStatus[]) => void;
	selectedModules: Set<number>;
	onModuleToggle: (moduleId: number) => void;
	onModulesChange: (
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[]
	) => void;
	structureId?: number;
	student?: Student;
	error?: string;
}

export default function ModuleSection({
	availableModules,
	setAvailableModules,
	selectedModules,
	onModuleToggle,
	onModulesChange,
	structureId,
	student,
	error,
}: ModuleSectionProps) {
	const [selectedModuleToAdd, setSelectedModuleToAdd] = useState<
		Awaited<ReturnType<typeof getStructureModules>>[number] | null
	>(null);
	const [searchInputKey, setSearchInputKey] = useState(0);

	function determineModuleStatus(
		moduleData: Awaited<ReturnType<typeof getStructureModules>>[number],
		existingRepeatModules: ModuleWithStatus[]
	): 'Compulsory' | 'Elective' | `Repeat${number}` {
		if (!student)
			return moduleData.type === 'Elective' ? 'Elective' : 'Compulsory';

		const attemptedModules = student.programs
			.flatMap((p) => p.semesters)
			.flatMap((s) => s.studentModules)
			.filter((m) => m.semesterModule.module?.name === moduleData.name);

		if (attemptedModules.length > 0) {
			const repeatCount =
				existingRepeatModules.filter(
					(m) => m.name === moduleData.name && m.status.includes('Repeat')
				).length + 1;
			return `Repeat${repeatCount}` as const;
		}

		return moduleData.type === 'Elective' ? 'Elective' : 'Compulsory';
	}

	const handleSelectModule = (
		moduleData: Awaited<ReturnType<typeof getStructureModules>>[number] | null
	) => {
		setSelectedModuleToAdd(moduleData);
	};

	const handleAddModule = () => {
		if (!selectedModuleToAdd) return;

		const moduleStatus = determineModuleStatus(
			selectedModuleToAdd,
			availableModules
		);

		const newModule: ModuleWithStatus = {
			semesterModuleId: selectedModuleToAdd.semesterModuleId,
			code: selectedModuleToAdd.code || '',
			name: selectedModuleToAdd.name || '',
			type: selectedModuleToAdd.type,
			credits: selectedModuleToAdd.credits,
			status: moduleStatus,
			semesterNo: selectedModuleToAdd.semesterNumber,
			prerequisites: [],
		};

		const isAlreadyAvailable = availableModules.some(
			(m) => m.semesterModuleId === newModule.semesterModuleId
		);

		if (!isAlreadyAvailable) {
			const updatedModules = [...availableModules, newModule];
			setAvailableModules(updatedModules);
			setSelectedModuleToAdd(null);
			setSearchInputKey((prev) => prev + 1);
		}
	};

	const handleStatusChange = (
		semesterModuleId: number,
		newStatus: StudentModuleStatus
	) => {
		const updatedModules = availableModules.map((module) =>
			module.semesterModuleId === semesterModuleId
				? {
						...module,
						status: newStatus as 'Compulsory' | 'Elective' | `Repeat${number}`,
					}
				: module
		);
		setAvailableModules(updatedModules);

		// Update form data with new status
		const selectedModulesList = updatedModules
			.filter((m) => selectedModules.has(m.semesterModuleId))
			.map((m) => ({
				moduleId: m.semesterModuleId,
				moduleStatus: newStatus,
			}));

		onModulesChange(selectedModulesList);
	};

	return (
		<>
			<Paper withBorder p='md'>
				<Group gap='xs' align='flex-end'>
					<Box style={{ flex: 1 }}>
						<ModuleSearchInput
							key={searchInputKey}
							label='Add  Module'
							placeholder='Search for modules by code or name'
							structureId={structureId || 0}
							value={selectedModuleToAdd?.semesterModuleId || null}
							onChange={() => {}}
							onModuleSelect={handleSelectModule}
							disabled={!structureId}
						/>
					</Box>
					<ActionIcon
						size='input-sm'
						variant='filled'
						color='blue'
						onClick={handleAddModule}
						disabled={!selectedModuleToAdd || !structureId}
						title='Add selected module'
					>
						<IconPlus size={16} />
					</ActionIcon>
				</Group>
			</Paper>

			<Box>
				<ModulesTable
					modules={availableModules}
					selectedModules={selectedModules}
					onModuleToggle={onModuleToggle}
					onStatusChange={handleStatusChange}
					error={error}
				/>
			</Box>
		</>
	);
}
