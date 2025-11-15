'use client';
import { getAssignedModulesByCurrentUser } from '@academic/assigned-modules/server';
import { getModules } from '@academic/modules/server';
import { useSession } from 'next-auth/react';
import { type PropsWithChildren, useState } from 'react';
import { ListItem, ListLayout, ModuleViewToggle } from '@/shared/ui/adease';

interface Module {
	id: number;
	code: string;
	name: string;
	timestamp?: string | null;
	status?: 'Active' | 'Defunct';
}

interface SemesterModule {
	id: number;
	moduleId: number | null;
	type: 'Major' | 'Minor' | 'Core' | 'Delete' | 'Elective';
	module: Module | null;
}

interface AssignedModule {
	id: number;
	userId: string;
	createdAt: Date | null;
	semesterModuleId: number;
	semesterModule: SemesterModule;
}

type ModuleItem = Module | AssignedModule;

export default function Layout({ children }: PropsWithChildren) {
	const { data: session } = useSession();
	const [showAssignedOnly, setShowAssignedOnly] = useState(true);
	const getData = async (page: number, search: string) => {
		if (showAssignedOnly) {
			const data = await getAssignedModulesByCurrentUser();
			return {
				items: data as AssignedModule[],
				totalPages: 1,
			};
		} else {
			const result = await getModules(page, search);
			return {
				items: result.items as Module[],
				totalPages: result.totalPages,
			};
		}
	};
	const renderItem = (it: ModuleItem) => {
		if (showAssignedOnly) {
			const isAssignedModule = (item: ModuleItem): item is AssignedModule =>
				'semesterModule' in item;

			if (isAssignedModule(it)) {
				const moduleId = it.semesterModule?.moduleId
					? String(it.semesterModule.moduleId)
					: '#';
				const moduleCode = it.semesterModule?.module?.code || 'Unknown';
				const moduleName = it.semesterModule?.module?.name || 'Unknown module';

				return (
					<ListItem id={moduleId} label={moduleCode} description={moduleName} />
				);
			}
			return <ListItem id='#' label='Unknown' description='Unknown module' />;
		} else {
			const isModule = (item: ModuleItem): item is Module =>
				'id' in item && 'code' in item && 'name' in item;

			if (isModule(it)) {
				return (
					<ListItem
						id={String(it.id ?? '#')}
						label={it.code}
						description={it.name}
					/>
				);
			}
			return <ListItem id='#' label='Unknown' description='Unknown module' />;
		}
	};

	return (
		<ListLayout
			path={'/assessments'}
			queryKey={
				showAssignedOnly ? ['assessments-assigned'] : ['assessments-all']
			}
			getData={getData}
			renderItem={renderItem}
			actionIcons={[
				session?.user?.position &&
					['admin', 'manager', 'program_leader'].includes(
						session.user.position
					) &&
					session.user.role !== 'academic' && (
						<ModuleViewToggle
							key='module-toggle'
							onToggle={setShowAssignedOnly}
							defaultValue={showAssignedOnly}
						/>
					),
			]}
		>
			{children}
		</ListLayout>
	);
}
