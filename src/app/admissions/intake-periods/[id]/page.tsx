import {
	Badge,
	Group,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { IconInfoCircle, IconSchool } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { isIntakePeriodActive } from '@/shared/lib/utils/dates';
import { DetailsView, DetailsViewHeader, FieldView } from '@/shared/ui/adease';
import {
	deleteIntakePeriod,
	getIntakePeriodWithPrograms,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

const LEVEL_LABELS: Record<string, string> = {
	certificate: 'Certificate',
	diploma: 'Diploma',
	degree: 'Degree',
};

export default async function IntakePeriodDetails({ params }: Props) {
	const { id } = await params;
	const item = await getIntakePeriodWithPrograms(id);

	if (!item) {
		return notFound();
	}

	const isActive = isIntakePeriodActive(item.startDate, item.endDate);
	const programs = item.intakePeriodPrograms?.map((ip) => ip.program) ?? [];

	const grouped = new Map<string, typeof programs>();
	for (const p of programs) {
		const list = grouped.get(p.level) ?? [];
		list.push(p);
		grouped.set(p.level, list);
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Intake Period'
				queryKey={['intake-periods']}
				handleDelete={async () => {
					'use server';
					await deleteIntakePeriod(id);
				}}
			/>
			<Tabs defaultValue='info'>
				<TabsList>
					<TabsTab value='info' leftSection={<IconInfoCircle size={16} />}>
						Information
					</TabsTab>
					<TabsTab value='programs' leftSection={<IconSchool size={16} />}>
						Open Programs
						<Badge ml='xs' size='sm' variant='light'>
							{programs.length}
						</Badge>
					</TabsTab>
				</TabsList>

				<TabsPanel value='info' pt='md'>
					<Stack gap='md'>
						<FieldView label='Name'>{item.name}</FieldView>
						<FieldView label='Status'>
							<Badge color={isActive ? 'green' : 'gray'}>
								{isActive ? 'Active' : 'Inactive'}
							</Badge>
						</FieldView>
						<FieldView label='Start Date'>{item.startDate}</FieldView>
						<FieldView label='End Date'>{item.endDate}</FieldView>
						<FieldView label='Application Fee'>
							<Text fw={500}>M{Number(item.applicationFee).toFixed(2)}</Text>
						</FieldView>
					</Stack>
				</TabsPanel>

				<TabsPanel value='programs' pt='md'>
					{programs.length > 0 ? (
						<Stack gap='lg'>
							{['degree', 'diploma', 'certificate'].map((level) => {
								const levelPrograms = grouped.get(level) ?? [];
								if (levelPrograms.length === 0) return null;
								return (
									<Stack key={level} gap='xs'>
										<Group gap='xs'>
											<Text fw={600}>{LEVEL_LABELS[level]}</Text>
											<Badge size='sm' variant='light'>
												{levelPrograms.length}
											</Badge>
										</Group>
										<Table striped highlightOnHover withTableBorder>
											<TableThead>
												<TableTr>
													<TableTh>Code</TableTh>
													<TableTh>Program Name</TableTh>
												</TableTr>
											</TableThead>
											<TableTbody>
												{levelPrograms.map((p) => (
													<TableTr key={p.id}>
														<TableTd>
															<Badge variant='light' size='sm'>
																{p.code}
															</Badge>
														</TableTd>
														<TableTd>{p.name}</TableTd>
													</TableTr>
												))}
											</TableTbody>
										</Table>
									</Stack>
								);
							})}
						</Stack>
					) : (
						<Text c='dimmed'>
							All programs are open for applications (no restrictions)
						</Text>
					)}
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
