import {
	deleteModule,
	getModulePrerequisites,
	getSemesterModule,
} from '@academic/semester-modules/server';
import {
	Fieldset,
	List,
	ListItem,
	SimpleGrid,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
	const { id } = await params;
	const item = await getSemesterModule(Number(id));
	const prerequisites = await getModulePrerequisites(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Semester Module'}
				queryKey={['modules']}
				handleDelete={async () => {
					'use server';
					await deleteModule(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='ID'>{item.id}</FieldView>
				<FieldView label='Module'>
					<Link size='sm' href={`/modules/${item.module?.id}`}>
						{item.module?.name} ({item.module?.code})
					</Link>
				</FieldView>
				<SimpleGrid cols={2}>
					<FieldView label='Type'>{item.type}</FieldView>
					<FieldView label='Credits'>{item.credits}</FieldView>
				</SimpleGrid>
				<FieldView label='Structure'>
					{item.semester?.structure ? (
						<Link
							size='sm'
							href={`/schools/structures/${item.semester.structure.id}`}
						>
							{item.semester.structure.code}
						</Link>
					) : (
						<Text size='sm' c='dimmed'>
							Not linked
						</Text>
					)}
				</FieldView>

				<Fieldset legend='Prerequisites'>
					{prerequisites.length === 0 ? (
						<Text size='sm'>No Prerequisites</Text>
					) : (
						<List
							spacing='xs'
							size='sm'
							center
							icon={
								<ThemeIcon color='gray' variant='light' size={'sm'} radius='xl'>
									<IconCircleCheck />
								</ThemeIcon>
							}
						>
							{prerequisites.map((it) => (
								<ListItem key={it.id}>
									<Link size='sm' href={`/semester-modules/${it.id}`}>
										{it.code} - {it.name}
									</Link>
								</ListItem>
							))}
						</List>
					)}
				</Fieldset>
			</DetailsViewBody>
		</DetailsView>
	);
}
