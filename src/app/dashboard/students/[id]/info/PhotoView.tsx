'use client';
import { getStudent, getStudentPhoto } from '@/server/students/actions';
import { Card, Image, Modal, UnstyledButton, Center } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconUser } from '@tabler/icons-react';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function PhotoView({ student }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const { data: photoUrl } = useQuery({
    queryKey: ['studentPhoto', student.stdNo],
    queryFn: () => getStudentPhoto(student.stdNo),
    staleTime: 1000 * 60 * 3,
  });

  const cardContent = photoUrl ? (
    <Card.Section>
      <Image
        src={photoUrl}
        alt='Student photo'
        w='100%'
        h='100%'
        fit='cover'
        radius={0}
        style={{ border: '1px solid #000' }}
      />
    </Card.Section>
  ) : (
    <Center h='100%'>
      <IconUser size='2rem' />
    </Center>
  );

  return (
    <>
      {photoUrl && (
        <Modal
          title={`${student.name} (${student.stdNo})`}
          opened={opened}
          onClose={close}
          size='lg'
          radius='md'
          centered
        >
          <Center>
            <Image
              src={photoUrl}
              alt='Student photo'
              fit='contain'
              h={'100%'}
              radius={'md'}
              w={'98%'}
            />
          </Center>
        </Modal>
      )}
      {photoUrl ? (
        <UnstyledButton onClick={open}>
          <Card withBorder radius={'md'} w={77} h={77} p={'xs'}>
            {cardContent}
          </Card>
        </UnstyledButton>
      ) : (
        <Card withBorder radius={'md'} w={77} h={77} p={'xs'}>
          {cardContent}
        </Card>
      )}
    </>
  );
}
