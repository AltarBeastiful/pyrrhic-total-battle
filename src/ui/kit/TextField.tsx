import { Input, Label, TextField as RACTextField, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { fieldBox, fieldDescription, fieldError, fieldLabel, fieldRoot } from './fieldStyles';
import { ring } from './styles';

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
      'text-fg placeholder:text-muted min-h-11 w-full min-w-0 px-3 text-base sm:min-h-9 sm:text-sm',
      'disabled:cursor-not-allowed disabled:opacity-50',
      ring,
    ),
    description: fieldDescription,
    error: fieldError,
  },
  variants: {
    isInvalid: {
      true: { input: 'border-danger' },
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
