import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Control } from 'react-hook-form';
import { RegisterFormSchema } from '.';
import { modules } from '@/db/schema';

type Props = {
  control: Control<RegisterFormSchema>;
  module: typeof modules.$inferSelect;
};

export default function ModuleInput({ control, module }: Props) {
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
              onCheckedChange={(checked) => {
                return checked
                  ? field.onChange([...field.value, module.id])
                  : field.onChange(
                      field.value?.filter(
                        (value: number) => value !== module.id
                      )
                    );
              }}
            />
          </FormControl>
          <div className='grid grow gap-1.5'>
            <FormLabel className='text-base font-medium'>
              {module.name}
            </FormLabel>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='font-mono'>{module.code}</span>
              <span>•</span>
              <span className='capitalize'>{module.type}</span>
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}
