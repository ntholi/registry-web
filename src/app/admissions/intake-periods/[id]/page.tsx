import { Badge, Group, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { isIntakePeriodActive } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import {
	deleteIntakePeriod,
	getIntakePeriodWithPrograms,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function IntakePeriodDetails({ params }: Props) {
	const { id } = await params;
	const item = await getIntakePeriodWithPrograms(id);

	if (!item) {
		return notFound();
	}

	const isActive = isIntakePeriodActive(item.startDate, item.endDate);
	const programs = item.intakePeriodPrograms?.map((ip) => ip.program) ?? [];

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
			<DetailsViewBody>
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
				<FieldView label='Open Programs'>
					{programs.length > 0 ? (
						<Stack gap='xs'>
							<Group gap='xs' wrap='wrap'>
								{programs.map((p) => (
									<Badge key={p.id} variant='light' size='sm'>
										{p.code}
									</Badge>
								))}
							</Group>
							<Text size='sm' c='dimmed'>
								{programs.length} program{programs.length !== 1 ? 's' : ''} open
								for applications
							</Text>
						</Stack>
					) : (
						<Text size='sm' c='dimmed'>
							All programs (no restrictions)
						</Text>
					)}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
