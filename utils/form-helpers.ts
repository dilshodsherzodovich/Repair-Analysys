// Form utility functions for common operations

export const formatFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object") {
          formData.append(`${key}[${index}]`, JSON.stringify(item))
        } else {
          formData.append(`${key}[${index}]`, String(item))
        }
      })
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })

  return formData
}

export const parseFormData = (formData: FormData): Record<string, any> => {
  const data: Record<string, any> = {}

  for (const [key, value] of formData.entries()) {
    if (key.includes("[") && key.includes("]")) {
      // Handle array fields
      const baseKey = key.split("[")[0]
      if (!data[baseKey]) {
        data[baseKey] = []
      }
      data[baseKey].push(value)
    } else {
      data[key] = value
    }
  }

  return data
}

export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "string") {
      // Basic HTML sanitization
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .trim()
    } else {
      sanitized[key] = value
    }
  })

  return sanitized
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Common form field transformers
export const transformers = {
  trimString: (value: string) => value?.trim() || "",

  normalizePhone: (value: string) => {
    return value?.replace(/\D/g, "") || ""
  },

  normalizeEmail: (value: string) => {
    return value?.toLowerCase().trim() || ""
  },

  parseNumber: (value: string) => {
    const num = Number.parseFloat(value)
    return isNaN(num) ? 0 : num
  },

  parseInteger: (value: string) => {
    const num = Number.parseInt(value, 10)
    return isNaN(num) ? 0 : num
  },

  formatCurrency: (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
    }).format(value)
  },

  formatDate: (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString("ru-RU")
  },

  formatDateTime: (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString("ru-RU")
  },
}

// Form state persistence
export const persistFormState = (key: string, data: any) => {
  try {
    localStorage.setItem(`form_${key}`, JSON.stringify(data))
  } catch (error) {
    console.warn("Failed to persist form state:", error)
  }
}

export const restoreFormState = (key: string) => {
  try {
    const stored = localStorage.getItem(`form_${key}`)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.warn("Failed to restore form state:", error)
    return null
  }
}

export const clearFormState = (key: string) => {
  try {
    localStorage.removeItem(`form_${key}`)
  } catch (error) {
    console.warn("Failed to clear form state:", error)
  }
}
