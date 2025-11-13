'use client';

import { Flex, Group, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';
import type { getAssignedModuleByUserAndModule } from '@/modules/academic/features/assigned-modules/server/actions';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import { toClassName } from '@/shared/lib/utils/utils';
import ExportButton from './export/ExportButton';

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
	const { currentTerm } = useCurrentTerm();
	const { data: session } = useSession();

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
			setProgramId(null);
		}
	}, [programId, setProgramId]);

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
		<Paper withBorder p='lg' mb='lg'>
			<Flex justify='space-between' wrap='nowrap'>
				<Stack gap={'xs'}>
					<Title order={2} fw={100}>
						{modules.at(0)?.semesterModule?.module?.name}
					</Title>
					<Group gap='md' align='center'>
						<Paper bg='var(--mantine-color-default)' px='sm' py={3} withBorder>
							<Text ff='monospace' fw={600} size='sm'>
								{modules.at(0)?.semesterModule?.module?.code}
							</Text>
						</Paper>
						<Group gap={5}>
							<IconCalendar size={'1rem'} />
							<Text size='sm' c='dimmed'>
								{currentTerm?.name}
							</Text>
						</Group>

						<Group gap={5} align='center'>
							<IconBook size={'1.1rem'} />
							<Text size='sm' c='dimmed'>
								{program ? `${program.name}` : 'All Programs'}
							</Text>
						</Group>
					</Group>
				</Stack>
				<Stack gap={'xs'} align='flex-end'>
					<Select
						placeholder='Select Program'
						data={moduleOptions}
						value={programId || ''}
						onChange={(value) => setProgramId(value === '' ? null : value)}
						rightSection={<IconChevronDown size={16} />}
						clearable
					/>
					<ExportButton
						moduleId={moduleId}
						moduleName={modules.at(0)?.semesterModule?.module?.name}
						moduleCode={modules.at(0)?.semesterModule?.module?.code}
						lecturerName={session?.user?.name || 'Unknown Lecturer'}
						termName={currentTerm?.name}
						className={className}
					/>
				</Stack>
			</Flex>
		</Paper>
	);
}
