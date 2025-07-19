import { Anchor, Group, Text } from '@mantine/core';
import Link from 'next/link';

type Prerequisite = {
  id: number;
  prerequisite: {
    id: number;
    module: {
      id: number;
      code: string;
      name: string;
    } | null;
  };
};

type Props = {
  prerequisites: Prerequisite[];
  hidden: boolean;
};

export default function PrerequisiteDisplay({ prerequisites, hidden }: Props) {
  if (!prerequisites || prerequisites.length === 0) {
    return (
      <Text size='sm' c='dimmed'>
        None
      </Text>
    );
  }

  return (
    <Group gap={'xs'}>
      {prerequisites.map((prereq, i) => (
        <Text key={prereq.id}>
          <Anchor
            component={Link}
            c={hidden ? 'dark' : undefined}
            href={`/admin/semester-modules/${prereq.prerequisite.id}`}
            size='0.85rem'
          >
            {prereq.prerequisite.module?.code}
          </Anchor>
          {prerequisites.length > 1 && i < prerequisites.length - 1 && ','}
        </Text>
      ))}
    </Group>
  );
}
