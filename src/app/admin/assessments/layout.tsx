'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getAssignedModulesByLecturer } from '@/server/assigned-modules/actions';
import { useSession } from 'next-auth/react';
import { unauthorized } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const userId = session.user.id;

  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={['assessments']}
      getData={async (_, __) => {
        const data = await getAssignedModulesByLecturer(userId);
        return {
          items: data,
          totalPages: 1,
        };
      }}
      actionIcons={[<NewLink key={'new-link'} href='/admin/assessments/new' />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.code} description={it.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
