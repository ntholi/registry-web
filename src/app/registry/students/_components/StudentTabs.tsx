'use client';

import { Tabs, TabsPanel, TabsTab } from '@mantine/core';
import type { Session } from 'next-auth';
import { useQueryState } from 'nuqs';
import type { getBlockedStudentByStdNo } from '@/app/registry/blocked-students';
import ScrollableTabsList from '@/shared/ui/ScrollableTabsList';
import type { getStudent } from '../_server/actions';
import AcademicsView from './academics/AcademicsView';
import BlockedAcademicsView from './academics/BlockedAcademicsView';
import StatementOfResultsPrinter from './academics/statements/StatementOfResultsPrinter';
import StudentCardPrinter from './card/StudentCardPrinter';
import StudentCardView from './card/StudentCardView';
import DocumentsView from './documents/DocumentsView';
import StudentFinanceView from './finance/StudentFinanceView';
import GraduationView from './graduation/GraduationView';
import StudentHistoryView from './history/StudentHistoryView';
import StudentView from './info/StudentView';
import RegistrationTabs from './registration/RegistrationTabs';
import SponsorsView from './sponsors/SponsorsView';

type StudentTabsProps = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	session: Session | null;
	blockedStudent: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

export default function StudentTabs({
	student,
	session,
	blockedStudent,
}: StudentTabsProps) {
	const showAcademics = [
		'academic',
		'admin',
		'registry',
		'finance',
		'leap',
	].includes(session?.user?.role ?? '');

	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: showAcademics ? 'academics' : 'info',
	});

	const showRegistration =
		['admin', 'registry', 'finance', 'student_services', 'leap'].includes(
			session?.user?.role ?? ''
		) ||
		['admin', 'manager', 'program_leader', 'year_leader'].includes(
			session?.user?.position ?? ''
		);

	const showSponsors = [
		'admin',
		'registry',
		'finance',
		'student_services',
	].includes(session?.user?.role ?? '');

	const showStatementOfResults =
		['admin', 'registry'].includes(session?.user?.role ?? '') ||
		['admin', 'manager', 'program_leader'].includes(
			session?.user?.position ?? ''
		);

	const showStudentCard = ['admin', 'registry'].includes(
		session?.user?.role ?? ''
	);

	const showGraduation = ['admin', 'registry'].includes(
		session?.user?.role ?? ''
	);

	const showFinance = ['admin', 'finance'].includes(session?.user?.role ?? '');

	const showDocuments =
		['admin', 'registry', 'finance', 'student_services'].includes(
			session?.user?.role ?? ''
		) || session?.user?.position === 'manager';

	const showHistory = [
		'admin',
		'registry',
		'finance',
		'academic',
		'library',
		'student_services',
		'marketing',
		'leap',
	].includes(session?.user?.role ?? '');

	const renderTabActions = () => {
		if (showStatementOfResults && activeTab === 'academics') {
			return (
				<StatementOfResultsPrinter
					stdNo={student.stdNo}
					disabled={!!blockedStudent}
				/>
			);
		}
		if (showStudentCard && activeTab === 'studentcard') {
			return (
				<StudentCardPrinter
					student={student}
					isActive={activeTab === 'studentcard'}
					disabled={!!blockedStudent}
				/>
			);
		}
		return null;
	};

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt={'xl'}>
			<ScrollableTabsList actions={renderTabActions()}>
				{showAcademics && <TabsTab value='academics'>Academics</TabsTab>}
				<TabsTab value='info'>Student</TabsTab>
				{showRegistration && (
					<TabsTab value='registration'>Registration</TabsTab>
				)}
				{showSponsors && <TabsTab value='sponsors'>Sponsors</TabsTab>}
				{showStudentCard && <TabsTab value='studentcard'>Card</TabsTab>}
				{showGraduation && <TabsTab value='graduation'>Graduation</TabsTab>}
				{showFinance && <TabsTab value='finance'>Finance</TabsTab>}
				{showDocuments && <TabsTab value='documents'>Documents</TabsTab>}
				{showHistory && <TabsTab value='history'>History</TabsTab>}
			</ScrollableTabsList>
			<TabsPanel value='academics' pt={'xl'} p={'sm'} key='academics'>
				{blockedStudent ? (
					<BlockedAcademicsView
						student={student}
						showMarks
						blockedStudent={blockedStudent}
					/>
				) : (
					<AcademicsView student={student} showMarks />
				)}
			</TabsPanel>
			<TabsPanel value='info' pt={'xl'} p={'sm'} key='info'>
				<StudentView student={student} />
			</TabsPanel>
			<TabsPanel value='registration' pt={'xl'} p={'sm'} key='registration'>
				<RegistrationTabs
					stdNo={student.stdNo}
					isActive={activeTab === 'registration'}
				/>
			</TabsPanel>
			<TabsPanel value='sponsors' pt={'xl'} p={'sm'} key='sponsors'>
				<SponsorsView
					stdNo={student.stdNo}
					isActive={activeTab === 'sponsors'}
				/>
			</TabsPanel>
			<TabsPanel value='studentcard' pt={'xl'} p={'sm'} key='studentcard'>
				<StudentCardView
					student={student}
					isActive={activeTab === 'studentcard'}
				/>
			</TabsPanel>
			<TabsPanel value='graduation' pt={'xl'} p={'sm'} key='graduation'>
				<GraduationView
					stdNo={student.stdNo.toString()}
					isActive={activeTab === 'graduation'}
					blockedStudent={blockedStudent}
				/>
			</TabsPanel>
			<TabsPanel value='finance' pt={'xl'} p={'sm'} key='finance'>
				<StudentFinanceView
					stdNo={student.stdNo}
					zohoContactId={student.zohoContactId}
					isActive={activeTab === 'finance'}
				/>
			</TabsPanel>
			<TabsPanel value='documents' pt={'xl'} p={'sm'} key='documents'>
				<DocumentsView
					stdNo={student.stdNo}
					isActive={activeTab === 'documents'}
				/>
			</TabsPanel>
			{showHistory && (
				<TabsPanel value='history' pt='xl' p='sm' key='history'>
					<StudentHistoryView
						stdNo={student.stdNo}
						isActive={activeTab === 'history'}
					/>
				</TabsPanel>
			)}
		</Tabs>
	);
}
