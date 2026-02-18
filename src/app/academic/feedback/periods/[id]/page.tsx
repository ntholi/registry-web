import { Badge, Divider, Stack, Title } from '@mantine/core';
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
import { deletePeriod, getPeriod } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

function getPeriodStatus(startDate: string, endDate: string) {
	const today = new Date().toISOString().slice(0, 10);
	if (today < startDate) return 'upcoming';
	if (today > endDate) return 'closed';
	return 'open';
}

export default async function PeriodDetails({ params }: Props) {
	const { id } = await params;
	const period = await getPeriod(Number(id));

	if (!period) {
		return notFound();
	}

	const status = getPeriodStatus(period.startDate, period.endDate);
	const termName =
		'term' in period && period.term
			? `${(period.term as { code: string; name?: string | null }).code}${
					(period.term as { name?: string | null }).name
						? ` — ${(period.term as { name?: string | null }).name}`
						: ''
				}`
			: String(period.termId);

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Period'
				queryKey={['feedback-periods']}
				handleDelete={async () => {
					'use server';
					await deletePeriod(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{period.name}</FieldView>
				<FieldView label='Term'>{termName}</FieldView>
				<FieldView label='Dates'>
					{formatDate(period.startDate)} — {formatDate(period.endDate)}
				</FieldView>
				<FieldView label='Status'>
					<Badge color={getStatusColor(status)} variant='light'>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Badge>
				</FieldView>
				<Divider my='md' />
				<Stack>
					<Title order={4}>Passphrase Management</Title>
					<PassphraseManager
						periodId={period.id}
						termId={period.termId}
						periodName={period.name}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
