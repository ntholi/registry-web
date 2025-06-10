'use client';
import { ListItem, ListLayout, ModuleViewToggle } from '@/components/adease';
import { getAssignedModulesByCurrentUser } from '@/server/assigned-modules/actions';
import { getModules } from '@/server/modules/actions';
import { PropsWithChildren, useState } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  const [showAssignedOnly, setShowAssignedOnly] = useState(true);
  const getData = async () => {
    if (showAssignedOnly) {
      const data = await getAssignedModulesByCurrentUser();
      return {
        items: data,
        totalPages: 1,
      };
    } else {
      return await getModules(1, '');
    }
  };
  const renderItem = (it: any) => {
    if (showAssignedOnly) {
      return (
        <ListItem
          id={it.semesterModule?.moduleId ?? '#'}
          label={it.semesterModule?.module?.code}
          description={it.semesterModule?.module?.name}
        />
      );
    } else {
      return (
        <ListItem id={it.id ?? '#'} label={it.code} description={it.name} />
      );
    }
  };

  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={
        showAssignedOnly ? ['assessments-assigned'] : ['assessments-all']
      }
      getData={getData}
      renderItem={renderItem}
      actionIcons={[
        <ModuleViewToggle
          key='module-toggle'
          onToggle={setShowAssignedOnly}
          defaultValue={showAssignedOnly}
        />,
      ]}
    >
      {children}
    </ListLayout>
  );
}
