'use client';

import { Box, Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import type { Session } from 'next-auth';
import type { getBlockedStudentByStdNo } from '@/modules/finance/features/blocked-students/server/actions';
import type { getStudent } from '@/modules/registry/features/students/server/actions';
import { useLocalStorage } from '@/shared/lib/hooks/use-local-storage';
import AcademicsView from './AcademicsView';
import BlockedAcademicsView from './AcademicsView/BlockedAcademicsView';
import StatementOfResultsPrinter from './AcademicsView/statements/StatementOfResultsPrinter';
import StudentCardPrinter from './card/StudentCardPrinter';
import StudentCardView from './card/StudentCardView';
import DocumentsView from './documents/DocumentsView';
import GraduationView from './graduation/GraduationView';
import StudentView from './info/StudentView';
import ProofOfRegistrationPrinter from './registration/proof/ProofOfRegistrationPrinter';
import RegistrationView from './registration/RegistrationView';

type StudentTabsProps = {
	student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	session: Session | null;
	blockedStudent: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

export function StudentTabs({
	student,
	session,
	blockedStudent,
}: StudentTabsProps) {
	const [activeTab, setActiveTab] = useLocalStorage<string | null>(
		'studentDetailsTab',
		'info'
	);

	const showAcademics = ['academic', 'admin', 'registry', 'finance'].includes(
		session?.user?.role ?? ''
	);

	const showRegistration =
		['admin', 'registry', 'finance', 'student_services'].includes(
			session?.user?.role ?? ''
		) ||
		['admin', 'manager', 'program_leader', 'year_leader'].includes(
			session?.user?.position ?? ''
		);

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

	const showDocuments =
		['admin', 'registry', 'finance', 'student_services'].includes(
			session?.user?.role ?? ''
		) || session?.user?.position === 'manager';

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt={'xl'}>
			<TabsList>
				{showAcademics && <TabsTab value='academics'>Academics</TabsTab>}
				<TabsTab value='info'>Student</TabsTab>
				{showRegistration && (
					<TabsTab value='registration'>Registration</TabsTab>
				)}
				{showStudentCard && <TabsTab value='studentcard'>Card</TabsTab>}
				{showGraduation && <TabsTab value='graduation'>Graduation</TabsTab>}
				{showDocuments && <TabsTab value='documents'>Documents</TabsTab>}
				{showStatementOfResults && activeTab === 'academics' && (
					<Box ml='auto'>
						<StatementOfResultsPrinter
							stdNo={student.stdNo}
							disabled={!!blockedStudent}
						/>
					</Box>
				)}
				{showRegistration &&
					activeTab === 'registration' &&
					['registry', 'admin'].includes(session?.user?.role ?? '') && (
						<Box ml='auto'>
							<ProofOfRegistrationPrinter stdNo={student.stdNo} />
						</Box>
					)}
				{showStudentCard && activeTab === 'studentcard' && (
					<Box ml='auto'>
						<StudentCardPrinter
							student={student}
							isActive={activeTab === 'studentcard'}
							disabled={!!blockedStudent}
						/>
					</Box>
				)}
			</TabsList>
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
				<RegistrationView
					stdNo={student.stdNo}
					isActive={activeTab === 'registration'}
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
			<TabsPanel value='documents' pt={'xl'} p={'sm'} key='documents'>
				<DocumentsView
					stdNo={student.stdNo}
					isActive={activeTab === 'documents'}
				/>
			</TabsPanel>
		</Tabs>
	);
}
