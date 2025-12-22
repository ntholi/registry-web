'use client';

import type { getAssignedModuleByUserAndModule } from '@academic/assigned-modules';
import {
	Badge,
	Flex,
	Group,
	Paper,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { toClassName } from '@/shared/lib/utils/utils';
import { useAssessmentsQuery } from '../hooks/useAssessmentsQuery';
import ExportButton from './export/ExportButton';
import ExcelImport from './import/ExcelImport';

type ModuleDetailsCardProps = {
	modules: NonNullable<
		Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
	>;
	moduleId: number;
};

export default function ModuleDetailsCard({
	modules,
	moduleId,
}: ModuleDetailsCardProps) {
	const [programId, setProgramId] = useQueryState('programId');
	const { activeTerm } = useActiveTerm();
	const { data: session } = useSession();
	const { data: assessments } = useAssessmentsQuery(moduleId);

	const moduleOptions = useMemo(() => {
		const options = [{ value: '', label: 'All Programs' }];
		const seen = new Set<number>();

		modules.forEach((module) => {
			const program = module.semesterModule?.semester?.structure.program;
			if (program && !seen.has(program.id)) {
				seen.add(program.id);
				options.push({
					value: program.id.toString(),
					label: toClassName(
						module.semesterModule.semester?.structure.program.code || '',
						module.semesterModule.semester?.name || ''
					),
				});
			}
		});

		return options;
	}, [modules]);

	useEffect(() => {
		if (programId === undefined) {
			if (moduleOptions.length >= 2) {
				setProgramId(moduleOptions[1].value);
			} else {
				setProgramId(null);
			}
		}
	}, [programId, setProgramId, moduleOptions]);

	const program = useMemo(() => {
		if (!programId) {
			return null;
		}
		return modules.find(
			(it) =>
				it.semesterModule?.semester?.structure.program.id === Number(programId)
		)?.semesterModule?.semester?.structure.program;
	}, [modules, programId]);

	const className = useMemo(() => {
		if (!program) return 'All Programs';

		const firstModule = modules.find(
			(it) => it.semesterModule?.semester?.structure.program.id === program.id
		);

		if (firstModule?.semesterModule?.semester) {
			return toClassName(
				program.code || '',
				firstModule.semesterModule.semester.name || ''
			);
		}

		return program.name || 'All Programs';
	}, [program, modules]);

	return (
		<Paper withBorder radius='md' shadow='sm' p='lg' mb='lg'>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start' wrap='nowrap'>
					<Title order={3} fw={600}>
						{modules.at(0)?.semesterModule?.module?.name}
					</Title>
					<Select
						size='sm'
						placeholder='Filter by program'
						data={moduleOptions}
						value={programId || ''}
						onChange={(value) => setProgramId(value === '' ? null : value)}
						clearable
						w={220}
					/>
				</Group>

				<Flex justify='space-between' align='center' gap='sm'>
					<Group>
						<Badge
							radius={'sm'}
							variant='light'
							color='gray'
							size='lg'
							ff='monospace'
						>
							{modules.at(0)?.semesterModule?.module?.code}
						</Badge>
						<Group gap={6}>
							<IconBook size={16} stroke={1.5} />
							<Text size='sm' c='dimmed'>
								{program?.name || 'All Programs'}
							</Text>
						</Group>
					</Group>
					<Group gap='sm'>
						{assessments && assessments.length > 0 && (
							<ExcelImport
								moduleId={moduleId}
								semesterModuleIds={modules.map((m) => m.semesterModuleId)}
								assessments={assessments.map((a) => ({
									id: a.id,
									assessmentType: a.assessmentType,
									assessmentNumber: a.assessmentNumber,
									totalMarks: a.totalMarks,
									weight: a.weight,
								}))}
							/>
						)}
						<ExportButton
							moduleId={moduleId}
							semesterModuleIds={modules.map((m) => m.semesterModuleId)}
							moduleName={modules.at(0)?.semesterModule?.module?.name}
							moduleCode={modules.at(0)?.semesterModule?.module?.code}
							lecturerName={session?.user?.name || 'Unknown Lecturer'}
							termCode={activeTerm?.code}
							className={className}
						/>
					</Group>
				</Flex>
			</Stack>
		</Paper>
	);
}
