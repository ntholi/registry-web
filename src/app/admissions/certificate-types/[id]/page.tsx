import {
	Badge,
	Group,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteCertificateType, getCertificateType } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CertificateTypeDetails({ params }: Props) {
	const { id } = await params;
	const item = await getCertificateType(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Certificate Type'
				queryKey={['certificate-types']}
				handleDelete={async () => {
					'use server';
					await deleteCertificateType(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Description'>
					{item.description || (
						<Text size='sm' c='dimmed'>
							No description
						</Text>
					)}
				</FieldView>
				<FieldView label='LQF Level'>
					<Badge variant='light'>Level {item.lqfLevel}</Badge>
				</FieldView>

				{item.lqfLevel === 4 ? (
					<FieldView label='Grade Mappings'>
						{item.gradeMappings && item.gradeMappings.length > 0 ? (
							<Table>
								<TableThead>
									<TableTr>
										<TableTh>Original Grade</TableTh>
										<TableTh>Standard Grade (LGCSE)</TableTh>
									</TableTr>
								</TableThead>
								<TableTbody>
									{item.gradeMappings.map((mapping) => (
										<TableTr key={mapping.id}>
											<TableTd>{mapping.originalGrade}</TableTd>
											<TableTd>
												<Badge variant='default'>{mapping.standardGrade}</Badge>
											</TableTd>
										</TableTr>
									))}
								</TableTbody>
							</Table>
						) : (
							<Text size='sm' c='dimmed'>
								No grade mappings defined
							</Text>
						)}
					</FieldView>
				) : (
					<FieldView label='Assessment Type'>
						<Group gap='xs'>
							<Text size='sm'>Uses result classifications:</Text>
							{['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'].map(
								(classification) => (
									<Badge key={classification} variant='default' size='sm'>
										{classification}
									</Badge>
								)
							)}
						</Group>
					</FieldView>
				)}
			</DetailsViewBody>
		</DetailsView>
	);
}
