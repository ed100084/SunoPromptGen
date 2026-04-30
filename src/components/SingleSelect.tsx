interface Props {
  options: Record<string, unknown>;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function SingleSelect({ options, value, onChange, placeholder = '請選擇' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none"
    >
      <option value="">{placeholder}</option>
      {Object.keys(options).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}
