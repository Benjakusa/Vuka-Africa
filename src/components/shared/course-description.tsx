import { formatDescription } from '@/lib/utils';

interface CourseDescriptionProps {
  content: string;
}

export function CourseDescription({ content }: CourseDescriptionProps) {
  if (!content) return null;

  return (
    <div
      className="space-y-3"
      dangerouslySetInnerHTML={{ __html: formatDescription(content) }}
    />
  );
}
