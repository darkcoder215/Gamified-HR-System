import { formatNumber, toWesternDigits } from '@/lib/format';

interface Props {
  value: number | string;
  className?: string;
  /** thousands separators for large numbers */
  group?: boolean;
}

// Renders numbers as Western digits, LTR, inside any Arabic context.
export default function NumberText({ value, className = '', group = false }: Props) {
  const text =
    typeof value === 'number' && group ? formatNumber(value) : toWesternDigits(value);
  return <span className={`num ${className}`}>{text}</span>;
}
