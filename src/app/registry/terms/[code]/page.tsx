import { Badge, Flex, SimpleGrid } from '@mantine/core';
import { notFound } from 'next/navigation';
import { deleteTerm, getTermByCode } from '@/app/registry/terms';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import TermSettingsSection from '../_components/TermSettingsSection';

type Props = {
	params: Promise<{ code: string }>;
};

export default async function TermDetails({ params }: Props) {
	const { code } = await params;
	const term = await getTermByCode(code);

	if (!term) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Term'}
				queryKey={['terms']}
				handleDelete={async () => {
					'use server';
					await deleteTerm(term.id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Code'>
					<Flex justify={'space-between'} align={'center'}>
						{term.code}
						<Badge color={getBooleanColor(term.isActive)}>
							{term.isActive ? 'Active' : 'Inactive'}
						</Badge>
					</Flex>
				</FieldView>
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md' mt='md'>
					<FieldView label='Name'>{term.name}</FieldView>
					<FieldView label='Year'>{term.year}</FieldView>
					<FieldView label='Start Date'>{term.startDate}</FieldView>
					<FieldView label='End Date'>{term.endDate}</FieldView>
				</SimpleGrid>

				<TermSettingsSection
					termId={term.id}
					termCode={term.code}
					settings={term.settings ?? null}
				/>
			</DetailsViewBody>
		</DetailsView>
	);
}
