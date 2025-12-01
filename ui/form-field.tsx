import { memo, useCallback, ChangeEvent } from "react";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";

export const FormField = memo(
  ({
    id,
    label,
    labelClassNames,
    value,
    defaultValue,
    onChange,
    placeholder,
    required,
    type = "text",
    step,
    rows,
    name,
  }: {
    id: string;
    label: string;
    labelClassNames?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    step?: string;
    rows?: number;
    name?: string;
  }) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(event.target.value);
      },
      [onChange]
    );

    const inputCommonProps =
      value !== undefined
        ? { value, onChange: handleChange }
        : {
            defaultValue,
            onChange: onChange ? handleChange : undefined,
          };

    if (type === "textarea") {
      return (
        <div>
          <Label className={labelClassNames} htmlFor={id}>
            {label}
          </Label>
          <Textarea
            id={id}
            name={name}
            {...inputCommonProps}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        </div>
      );
    }

    return (
      <div>
        <Label className={labelClassNames} htmlFor={id}>
          {label}
        </Label>
        <Input
          id={id}
          name={name}
          type={type}
          step={step}
          {...inputCommonProps}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }
);
FormField.displayName = "FormField";
