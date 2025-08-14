'use client';

import {
  Card,
  Center,
  Image,
  Modal,
  UnstyledButton,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash } from '@tabler/icons-react';

type PhotoPreviewModalProps = {
  photoUrl: string;
  title: string;
  alt?: string;
  width?: number;
  height?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
};

export default function PhotoPreviewModal({
  photoUrl,
  title,
  alt = 'Photo',
  width = 76,
  height = 76,
  onEdit,
  onDelete,
  canEdit = false,
}: PhotoPreviewModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        title={title}
        opened={opened}
        onClose={close}
        size='lg'
        radius='md'
        centered
      >
        <Center>
          <Image
            src={photoUrl}
            alt={alt}
            fit='contain'
            h={'100%'}
            radius={'md'}
            w={'98%'}
          />
        </Center>

        {canEdit && (onEdit || onDelete) && (
          <Group justify='center' mt='md' gap='sm'>
            {onEdit && (
              <Tooltip label='Change photo'>
                <ActionIcon
                  variant='filled'
                  color='blue'
                  size='lg'
                  onClick={() => {
                    onEdit();
                    close();
                  }}
                >
                  <IconEdit size='1.2rem' />
                </ActionIcon>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label='Delete photo'>
                <ActionIcon
                  variant='filled'
                  color='red'
                  size='lg'
                  onClick={() => {
                    onDelete();
                    close();
                  }}
                >
                  <IconTrash size='1.2rem' />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        )}
      </Modal>

      <UnstyledButton onClick={open}>
        <Card withBorder radius={'md'} w={width} h={height} p={'xs'}>
          <Card.Section>
            <Image
              src={photoUrl}
              alt={alt}
              w='100%'
              h='100%'
              fit='cover'
              radius={0}
              style={{ border: '1px solid #000' }}
            />
          </Card.Section>
        </Card>
      </UnstyledButton>
    </>
  );
}
