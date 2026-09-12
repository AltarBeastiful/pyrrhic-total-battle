import { Input, Label, TextField as RACTextField, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { fieldBox, fieldDescription, fieldError, fieldHeight, fieldLabel, fieldRoot } from './fieldStyles';

export interface TextFieldProps {
  /** The visible name of what is being typed. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string;
  /** The HTML input type: `text` unless it is an address, an e-mail or a password. */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  /** The keyboard a phone should offer. */
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  /** An example of what to type. Never a substitute for the label. */
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

const textFieldStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    input: cn(
      fieldBox,
      fieldHeight,
      'text-fg placeholder:text-muted w-full min-w-0 px-3 text-base sm:text-sm',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'outline-none focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-accent',
      'focus-visible:-outline-offset-1 focus-visible:ring-0',
    ),
    description: fieldDescription,
    error: fieldError,
  },
  variants: {
    isInvalid: {
      true: { input: 'border-danger focus-visible:border-danger focus-visible:outline-danger' },
      false: {},
    },
  },
  defaultVariants: { isInvalid: false },
});

/** One line of text with its label above it, and room for a hint or a reason it cannot be used. */
export function TextField({
  label,
  value,
  onChange,
  description,
  errorMessage,
  type = 'text',
  inputMode,
  placeholder,
  isDisabled = false,
  className,
}: TextFieldProps) {
  const styles = textFieldStyles({ isInvalid: errorMessage !== undefined });

  return (
    <RACTextField
      className={cn(styles.root(), className)}
      value={value}
      onChange={onChange}
      type={type}
      isInvalid={errorMessage !== undefined}
      isDisabled={isDisabled}
    >
      <Label className={styles.label()}>{label}</Label>
      <Input
        className={styles.input()}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(inputMode === undefined ? {} : { inputMode })}
      />
      {description !== undefined && (
        <Text slot="description" className={styles.description()}>
          {description}
        </Text>
      )}
      {errorMessage !== undefined && (
        <Text slot="errorMessage" className={styles.error()}>
          {errorMessage}
        </Text>
      )}
    </RACTextField>
  );
}
