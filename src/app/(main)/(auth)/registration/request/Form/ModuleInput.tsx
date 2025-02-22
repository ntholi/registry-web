import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { AlertCircle } from 'lucide-react';
import { Control } from 'react-hook-form';
import { RegisterFormSchema } from '.';
import { getStudentSemesterModules } from '../actions';

type Props = {
  control: Control<RegisterFormSchema>;
  module: Awaited<
    ReturnType<typeof getStudentSemesterModules>
  >['modules'][number];
  failedPrerequisites?: string[];
};

export default function ModuleInput({
  control,
  module,
  failedPrerequisites,
}: Props) {
  const hasFailedPrerequisites = (failedPrerequisites?.length ?? 0) > 0;

  return (
    <FormField
      key={module.id}
      control={control}
      name='modules'
      render={({ field }) => (
        <FormItem className='relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring'>
          <FormControl>
            <Checkbox
              className='order-1 after:absolute after:inset-0'
              checked={field.value?.includes(module.id)}
              disabled={hasFailedPrerequisites}
              onCheckedChange={(checked) => {
                return checked
                  ? field.onChange([...field.value, module.id])
                  : field.onChange(
                      field.value?.filter(
                        (value: number) => value !== module.id,
                      ),
                    );
              }}
            />
          </FormControl>
          <div className='grid grow gap-1.5'>
            <div className='flex items-center gap-2'>
              <FormLabel className='text-sm sm:text-base'>
                {module.name}
              </FormLabel>
              {hasFailedPrerequisites && (
                <AlertCircle className='h-4 w-4 text-destructive' />
              )}
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='font-mono'>{module.code}</span>
              <span>•</span>
              <span className='capitalize'>{module.type}</span>
            </div>
          </div>
          <div className='absolute bottom-3 right-4'>
            {hasFailedPrerequisites ? (
              <Badge variant='destructive' className='mb-1'>
                Prerequisite ({failedPrerequisites?.join(', ')})
              </Badge>
            ) : (
              <Badge
                variant={
                  module.status === 'Compulsory' ? 'secondary' : 'destructive'
                }
              >
                {module.status}
              </Badge>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
