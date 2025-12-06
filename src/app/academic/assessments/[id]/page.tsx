import { AssessmentsTable, ModuleLecturers } from '@academic/assessments';
import { getModule } from '@academic/modules';
import { Button, Divider, Group, Paper, Title } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailsView } from '@/shared/ui/adease';

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
			<Group justify='space-between' align='center' mb='md'>
				<Title order={3} fw={400}>
					{mod.name} ({mod.code})
				</Title>
				<Link href={`/academic/gradebook/${mod.id}`} passHref>
					<Button
						variant='light'
						leftSection={<IconNotebook size={16} />}
						size={'sm'}
					>
						Gradebook
					</Button>
				</Link>
			</Group>

			<Paper p='md' radius='md' withBorder shadow='sm' mb='md' mt='lg'>
				<Title order={4} fw={400} mb='md'>
					Lecturers
				</Title>
				<Divider my='sm' />
				<ModuleLecturers moduleId={mod.id} />
			</Paper>

			<AssessmentsTable moduleId={mod.id} />
		</DetailsView>
	);
}
