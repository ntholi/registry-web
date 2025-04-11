import { getModulePrerequisites } from '@/server/semester-modules/actions';
import { Anchor, Group, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type Props = {
  moduleId: number;
  hidden: boolean;
};

export default function PrerequisiteDisplay({ moduleId, hidden }: Props) {
  const { data, isLoading } = useQuery({
    queryFn: async () => await getModulePrerequisites(moduleId),
    queryKey: ['modulePrerequisites', moduleId],
  });

  if (isLoading) {
    return (
      <Text size='sm' c='dimmed'>
        ...
      </Text>
    );
  }

  return (
    <Group gap={'xs'}>
      {data?.map((it, i) => (
        <Text key={it.id}>
          <Anchor
            component={Link}
            c={hidden ? 'dark' : undefined}
            href={`/admin/modules/${it.id}`}
            size='0.85rem'
          >
            {it.name}
          </Anchor>
          {data.length > 1 && i < data.length - 1 && ','}
        </Text>
      ))}
    </Group>
  );
}
