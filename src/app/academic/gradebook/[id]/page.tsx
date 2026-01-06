import { getAssignedModuleByUserAndModule } from '@academic/assigned-modules';
import { Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import ModuleDetailsCard from '../_components/ModuleDetailsCard';
import StudentTable from '../_components/StudentTable';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
	const { id } = await params;

	const modules = await getAssignedModuleByUserAndModule(Number(id));

	if (!modules || modules.length === 0) {
		return notFound();
	}

	const semesterModuleIds = modules.map((m) => m.semesterModuleId);
	const moduleData = modules.at(0)?.semesterModule?.module;

	return (
		<Stack gap='lg' p='lg'>
			<ModuleDetailsCard modules={modules} moduleId={Number(id)} />
			<StudentTable
				moduleId={Number(id)}
				semesterModuleIds={semesterModuleIds}
				moduleCode={moduleData?.code ?? ''}
				moduleName={moduleData?.name ?? ''}
			/>
		</Stack>
	);
}
