'use client';
import { deleteDocument, uploadDocument } from '@/lib/storage';
import { getStudent, getStudentPhoto } from '@/server/students/actions';
import { ActionIcon, Card, Center } from '@mantine/core';
import { IconUpload, IconUser, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import PhotoInputModal from './PhotoInputModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import DeletePhotoModal from './DeletePhotoModal';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function PhotoView({ student }: Props) {
  const { data: photoUrl, refetch } = useQuery({
    queryKey: ['studentPhoto', student.stdNo],
    queryFn: () => getStudentPhoto(student.stdNo),
    staleTime: 1000 * 60 * 3,
  });
  const { data: session } = useSession();

  const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
    try {
      if (photoUrl) {
        await deleteDocument(photoUrl);
      }

      const fileName = `${student.stdNo}.jpg`;
      const photoFile = new File([croppedImageBlob], fileName, {
        type: 'image/jpeg',
      });

      await uploadDocument(photoFile, fileName);
      await refetch();

      notifications.show({
        title: 'Success',
        message: 'Photo updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update photo',
        color: 'red',
      });
    }
  };

  const handlePhotoDelete = async () => {
    try {
      if (photoUrl) {
        await deleteDocument(photoUrl);
        await refetch();

        notifications.show({
          title: 'Success',
          message: 'Photo deleted successfully',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete photo',
        color: 'red',
      });
    }
  };

  const canEditPhoto = ['admin', 'registry'].includes(
    session?.user?.role ?? ''
  );

  const cardContent = (
    <Center h='100%'>
      <IconUser size='2rem' />
    </Center>
  );

  return (
    <>
      <div style={{ position: 'relative' }}>
        {photoUrl ? (
          <>
            <PhotoPreviewModal
              photoUrl={photoUrl}
              title={`${student.name} (${student.stdNo})`}
              alt='Student photo'
              width={76}
              height={76}
            />
            {canEditPhoto && (
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  display: 'flex',
                  gap: '4px',
                  zIndex: 2,
                }}
              >
                <PhotoInputModal
                  onPhotoSubmit={handlePhotoSubmit}
                  title={`Change Photo for ${student.name}`}
                  renderTrigger={({ open }) => (
                    <ActionIcon
                      size='sm'
                      variant='filled'
                      color='blue'
                      style={{ opacity: 0.9 }}
                      onClick={open}
                      title='Change photo'
                    >
                      <IconEdit size='0.7rem' />
                    </ActionIcon>
                  )}
                />
                <DeletePhotoModal
                  onConfirm={handlePhotoDelete}
                  studentName={student.name}
                  renderTrigger={({ open }) => (
                    <ActionIcon
                      size='sm'
                      variant='filled'
                      color='red'
                      style={{ opacity: 0.9 }}
                      onClick={open}
                      title='Delete photo'
                    >
                      <IconTrash size='0.7rem' />
                    </ActionIcon>
                  )}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <Card withBorder radius={'md'} w={76} h={76} p={'xs'}>
              {cardContent}
            </Card>
            {canEditPhoto && (
              <PhotoInputModal
                onPhotoSubmit={handlePhotoSubmit}
                title={`Upload Photo for ${student.name}`}
                renderTrigger={({ open }) => (
                  <ActionIcon
                    size='sm'
                    style={{
                      position: 'absolute',
                      opacity: 0.7,
                      top: 4,
                      right: 4,
                      zIndex: 1,
                    }}
                    onClick={open}
                    title='Upload photo'
                  >
                    <IconUpload size='0.8rem' />
                  </ActionIcon>
                )}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
