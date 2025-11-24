import { memo, useCallback, ChangeEvent } from "react";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";

export const FormField = memo(
  ({
    id,
    label,
    value,
    onChange,
    placeholder,
    required,
    type = "text",
    step,
    rows,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    step?: string;
    rows?: number;
  }) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(event.target.value);
      },
      [onChange]
    );

    if (type === "textarea") {
      return (
        <div>
          <Label htmlFor={id}>{label}</Label>
          <Textarea
            id={id}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        </div>
      );
    }

    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          step={step}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }
);
FormField.displayName = "FormField";
