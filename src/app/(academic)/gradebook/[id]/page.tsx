import { getAssignedModuleByUserAndModule } from '@academic/assigned-modules';
import { StudentTable } from '@academic/gradebook';
import { Container, Paper } from '@mantine/core';
import { notFound } from 'next/navigation';
import ModuleDetailsCard from '@/modules/academic/features/gradebook/components/ModuleDetailsCard';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
	const { id } = await params;

	const modules = await getAssignedModuleByUserAndModule(Number(id));

	if (!modules) {
		return notFound();
	}

	return (
		<Container size='xl' p='md'>
			<ModuleDetailsCard modules={modules} moduleId={Number(id)} />
			<Paper withBorder radius='md' shadow='sm' p='lg'>
				<StudentTable moduleId={Number(id)} />
			</Paper>
		</Container>
	);
}
