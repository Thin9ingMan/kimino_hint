import { Select, TextInput } from '@mantine/core';

export default function LabeledField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onValueChange,
  placeholder,
  required,
  autoFocus,
  options = [],
}) {
  const handleChange = (nextValue) => {
    // Keep legacy behavior: support both onChange(event) and onValueChange(value).
    // For Mantine we don't get the DOM event in all cases; we emulate the minimum surface.
    if (onChange) {
      onChange({
        target: { value: nextValue, name, id },
        currentTarget: { value: nextValue, name, id },
      });
    }
    if (onValueChange) onValueChange(nextValue);
  };

  if (type === 'select') {
    return (
      <Select
        id={id}
        name={name}
        label={label}
        placeholder={placeholder ?? '選択してください'}
        value={value ?? ''}
        onChange={(v) => handleChange(v ?? '')}
        data={options.map((opt) => ({ value: opt, label: opt }))}
        required={required}
        withAsterisk={required}
        autoFocus={autoFocus}
        radius="md"
        styles={{
          label: { fontWeight: 600, color: '#065f46' },
        }}
      />
    );
  }

  return (
    <TextInput
      id={id}
      name={name}
      label={label}
      type={type}
      value={value ?? ''}
      onChange={(e) => handleChange(e.currentTarget.value)}
      placeholder={placeholder}
      required={required}
      withAsterisk={required}
      autoFocus={autoFocus}
      radius="md"
      styles={{
        label: { fontWeight: 600, color: '#065f46' },
      }}
    />
  );
}