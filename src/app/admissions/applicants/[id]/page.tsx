import { Stack, Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import {
	IconCertificate,
	IconFileText,
	IconPhone,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { notFound, redirect } from 'next/navigation';
import { deleteApplicant, getApplicant } from '../_server/actions';
import AcademicRecordsTab from './_components/AcademicRecordsTab';
import ApplicantHeader from './_components/ApplicantHeader';
import ContactTab from './_components/ContactTab';
import DocumentsTab from './_components/DocumentsTab';
import GuardiansTab from './_components/GuardiansTab';
import PersonalInfoTab from './_components/PersonalInfoTab';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplicantDetails({ params }: Props) {
	const { id } = await params;
	const item = await getApplicant(id);

	if (!item) {
		return notFound();
	}

	async function handleDelete() {
		'use server';
		await deleteApplicant(id);
		redirect('/admissions/applicants');
	}

	return (
		<Stack gap='lg' p={{ base: 'sm', md: 'lg' }}>
			<ApplicantHeader
				id={item.id}
				fullName={item.fullName}
				dateOfBirth={item.dateOfBirth}
				nationality={item.nationality}
				gender={item.gender}
				nationalId={item.nationalId}
				onDelete={handleDelete}
			/>

			<Tabs defaultValue='personal' variant='outline'>
				<TabsList>
					<TabsTab value='personal' leftSection={<IconUser size={16} />}>
						Personal
					</TabsTab>
					<TabsTab value='contact' leftSection={<IconPhone size={16} />}>
						Contact
					</TabsTab>
					<TabsTab value='guardians' leftSection={<IconUsers size={16} />}>
						Guardians
					</TabsTab>
					<TabsTab value='academic' leftSection={<IconCertificate size={16} />}>
						Academic
					</TabsTab>
					<TabsTab value='documents' leftSection={<IconFileText size={16} />}>
						Documents
					</TabsTab>
				</TabsList>

				<TabsPanel value='personal' pt='lg'>
					<PersonalInfoTab
						fullName={item.fullName}
						dateOfBirth={item.dateOfBirth}
						nationalId={item.nationalId}
						nationality={item.nationality}
						birthPlace={item.birthPlace}
						religion={item.religion}
						address={item.address}
					/>
				</TabsPanel>

				<TabsPanel value='contact' pt='lg'>
					<ContactTab applicantId={item.id} phones={item.phones} />
				</TabsPanel>

				<TabsPanel value='guardians' pt='lg'>
					<GuardiansTab applicantId={item.id} guardians={item.guardians} />
				</TabsPanel>

				<TabsPanel value='academic' pt='lg'>
					<AcademicRecordsTab
						applicantId={item.id}
						records={item.academicRecords}
					/>
				</TabsPanel>

				<TabsPanel value='documents' pt='lg'>
					<DocumentsTab applicantId={item.id} documents={item.documents} />
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
