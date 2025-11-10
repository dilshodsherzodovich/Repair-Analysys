import { z } from "zod";

// Common validation messages in Russian
export const validationMessages = {
  required: "Это поле обязательно для заполнения",
  email: "Введите корректный email адрес",
  minLength: (min: number) => `Минимальная длина: ${min} символов`,
  maxLength: (max: number) => `Максимальная длина: ${max} символов`,
  minValue: (min: number) => `Минимальное значение: ${min}`,
  maxValue: (max: number) => `Максимальное значение: ${max}`,
  invalidDate: "Введите корректную дату",
  futureDate: "Дата не может быть в будущем",
  pastDate: "Дата не может быть в прошлом",
  fileSize: (maxSize: number) => `Максимальный размер файла: ${maxSize}MB`,
  fileType: (types: string[]) => `Поддерживаемые форматы: ${types.join(", ")}`,
  phoneNumber: "Введите корректный номер телефона",
  password: "Пароль должен содержать минимум 8 символов, включая цифры и буквы",
  confirmPassword: "Пароли не совпадают",
  url: "Введите корректный URL адрес",
  numeric: "Введите только цифры",
  alphanumeric: "Используйте только буквы и цифры",
};

// Base validation schemas
export const baseSchemas = {
  email: z.string().email(validationMessages.email),
  password: z
    .string()
    .min(8, validationMessages.minLength(8))
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, validationMessages.password),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, validationMessages.phoneNumber),
  url: z.string().url(validationMessages.url),
  requiredString: (minLength = 1) =>
    z
      .string()
      .min(
        minLength,
        minLength === 1
          ? validationMessages.required
          : validationMessages.minLength(minLength)
      ),
  optionalString: (maxLength?: number) =>
    z
      .string()
      .optional()
      .refine((val) => !maxLength || !val || val.length <= maxLength, {
        message: maxLength
          ? validationMessages.maxLength(maxLength)
          : undefined,
      }),
  dateString: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: validationMessages.invalidDate,
  }),
  futureDate: z.string().refine((val) => !val || new Date(val) > new Date(), {
    message: validationMessages.futureDate,
  }),
  pastDate: z.string().refine((val) => !val || new Date(val) < new Date(), {
    message: validationMessages.pastDate,
  }),
  numericString: z.string().regex(/^\d+$/, validationMessages.numeric),
  alphanumericString: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, validationMessages.alphanumeric),
};

// Document-specific validation schemas
export const documentSchemas = {
  documentTitle: baseSchemas
    .requiredString(3)
    .max(200, validationMessages.maxLength(200)),
  documentDescription: baseSchemas.optionalString(1000),
  documentCategory: baseSchemas.requiredString(),
  documentTags: z.array(z.string()).optional(),
  documentStatus: z.enum(["draft", "review", "approved", "archived"]),
  documentVersion: z
    .string()
    .regex(/^\d+\.\d+(\.\d+)?$/, "Формат версии: X.Y или X.Y.Z"),
  documentAuthor: baseSchemas
    .requiredString(2)
    .max(100, validationMessages.maxLength(100)),
  documentDepartment: baseSchemas.requiredString(),
  documentPriority: z.enum(["low", "medium", "high", "urgent"]),
  documentDeadline: baseSchemas.dateString,
  documentApprover: baseSchemas.optionalString(),
  documentComments: baseSchemas.optionalString(2000),
};

// User validation schemas
export const userSchemas = {
  firstName: baseSchemas
    .requiredString(2)
    .max(50, validationMessages.maxLength(50)),
  lastName: baseSchemas
    .requiredString(2)
    .max(50, validationMessages.maxLength(50)),
  email: baseSchemas.email,
  phoneNumber: baseSchemas.phoneNumber.optional(),
  position: baseSchemas
    .requiredString(2)
    .max(100, validationMessages.maxLength(100)),
  department: baseSchemas.requiredString(),
  role: z.enum(["admin", "manager", "employee", "viewer"]),
  isActive: z.boolean().default(true),
};

// File validation
export const createFileValidation = (
  maxSizeMB = 10,
  allowedTypes: string[] = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "jpeg",
    "png",
  ]
) => {
  return z.object({
    file: z
      .instanceof(File)
      .refine(
        (file) => file.size <= maxSizeMB * 1024 * 1024,
        validationMessages.fileSize(maxSizeMB)
      )
      .refine((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        return extension && allowedTypes.includes(extension);
      }, validationMessages.fileType(allowedTypes)),
  });
};

// Common form schemas
export const formSchemas = {
  login: z.object({
    username: baseSchemas.requiredString(3),
    password: baseSchemas.requiredString(1),
    rememberMe: z.boolean().optional(),
  }),
  userProfile: z.object({
    firstName: userSchemas.firstName,
    lastName: userSchemas.lastName,
    email: userSchemas.email,
    phoneNumber: userSchemas.phoneNumber,
    position: userSchemas.position,
    department: userSchemas.department,
  }),
  documentForm: z.object({
    title: documentSchemas.documentTitle,
    description: documentSchemas.documentDescription,
    category: documentSchemas.documentCategory,
    tags: documentSchemas.documentTags,
    status: documentSchemas.documentStatus,
    priority: documentSchemas.documentPriority,
    deadline: documentSchemas.documentDeadline,
    author: documentSchemas.documentAuthor,
    department: documentSchemas.documentDepartment,
    approver: documentSchemas.documentApprover,
    comments: documentSchemas.documentComments,
  }),
  changePassword: z
    .object({
      currentPassword: baseSchemas.requiredString(),
      newPassword: baseSchemas.password,
      confirmPassword: baseSchemas.requiredString(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: validationMessages.confirmPassword,
      path: ["confirmPassword"],
    }),
  contactForm: z.object({
    name: baseSchemas
      .requiredString(2)
      .max(100, validationMessages.maxLength(100)),
    email: baseSchemas.email,
    subject: baseSchemas
      .requiredString(5)
      .max(200, validationMessages.maxLength(200)),
    message: baseSchemas
      .requiredString(10)
      .max(2000, validationMessages.maxLength(2000)),
  }),
};

// Validation helper functions
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error?: string } => {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: "Ошибка валидации" };
  }
};

export const validateForm = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { isValid: boolean; errors: Record<string, string>; data?: T } => {
  try {
    const validData = schema.parse(data);
    return { isValid: true, errors: {}, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: "Ошибка валидации формы" } };
  }
};
