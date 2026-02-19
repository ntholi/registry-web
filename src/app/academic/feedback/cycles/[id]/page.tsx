import { Badge, Divider, Group, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import PassphraseManager from '../_components/PassphraseManager';
import { deleteCycle, getCycle } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

function getCycleStatus(startDate: string, endDate: string) {
	const today = new Date().toISOString().slice(0, 10);
	if (today < startDate) return 'upcoming';
	if (today > endDate) return 'closed';
	return 'open';
}

export default async function CycleDetails({ params }: Props) {
	const { id } = await params;
	const cycle = await getCycle(id);

	if (!cycle) {
		return notFound();
	}

	const status = getCycleStatus(cycle.startDate, cycle.endDate);
	const termName =
		'term' in cycle && cycle.term
			? `${(cycle.term as { code: string; name?: string | null }).code}${
					(cycle.term as { name?: string | null }).name
						? ` — ${(cycle.term as { name?: string | null }).name}`
						: ''
				}`
			: String(cycle.termId);

	const cycleSchools =
		'cycleSchools' in cycle
			? (cycle.cycleSchools as { school: { id: number; code: string } }[])
			: [];

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Feedback Cycle'
				queryKey={['feedback-cycles']}
				handleDelete={async () => {
					'use server';
					await deleteCycle(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{cycle.name}</FieldView>
				<FieldView label='Term'>{termName}</FieldView>
				<FieldView label='Dates'>
					{formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
				</FieldView>
				<FieldView label='Status'>
					<Badge color={getStatusColor(status)} variant='light'>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Badge>
				</FieldView>
				{cycleSchools.length > 0 && (
					<FieldView label='Schools'>
						<Group gap='xs'>
							{cycleSchools.map((cs) => (
								<Text key={cs.school.id} size='sm'>
									{cs.school.code}
								</Text>
							))}
						</Group>
					</FieldView>
				)}
				<Divider label='Passphrase Management' labelPosition='left' mt='xl' />
				<Stack>
					<PassphraseManager
						cycleId={cycle.id}
						termId={cycle.termId}
						cycleName={cycle.name}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
