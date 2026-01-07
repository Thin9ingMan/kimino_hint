import styles from "./LabeledField.module.css";

export default function LabeledField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onValueChange,
  placeholder,
  required,
  autoFocus,
  options = [],
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  const renderControl = () => {
    if (type === "select") {
      return (
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className={styles.control}
        >
          <option value="">選択してください</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className={styles.control}
      />
    );
  };

  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {renderControl()}
    </div>
  );
}