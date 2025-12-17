import styles from "./Button.module.css";

export default function Button({
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
  children,
}) {
  const className =
    variant === "ghost"
      ? `${styles.btn} ${styles.ghost}`
      : `${styles.btn} ${styles.primary}`;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}