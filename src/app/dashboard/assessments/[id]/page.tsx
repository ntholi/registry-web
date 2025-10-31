import { Button, Group, Paper, Title } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailsView } from '@/components/adease';
import { getModule } from '@/server/modules/actions';
import AssessmentsTable from './AssessmentsTable';
import ModuleLecturers from './ModuleLecturers';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
	const { id } = await params;
	const mod = await getModule(Number(id));

	if (!mod) {
		return notFound();
	}
	return (
		<DetailsView>
			<Group justify="space-between" align="center" mb="md">
				<Title order={3} fw={400}>
					{mod.code} - {mod.name}
				</Title>
				<Link href={`/dashboard/gradebook/${mod.id}`} passHref>
					<Button variant="light" leftSection={<IconNotebook size={16} />} size="sm">
						View Gradebook
					</Button>
				</Link>
			</Group>

			<Paper p="md" radius="md" withBorder shadow="sm" mb="md" mt="lg">
				<Title order={4} fw={400} mb="md">
					Assigned Lecturers
				</Title>
				<ModuleLecturers moduleId={mod.id} />
			</Paper>

			<AssessmentsTable moduleId={mod.id} />
		</DetailsView>
	);
}
