import { AxiosError } from "axios"
import type { ApiError } from "./client"

function extractErrorMessage(err: ApiError): string {
  if (err instanceof AxiosError) {
    return err.message
  }

  const errDetail = (err.body as any)?.detail
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return errDetail[0].msg
  }
  return errDetail || "Something went wrong."
}

export const handleError = function (
  this: (msg: string) => void,
  err: ApiError,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export const nowForDatetimeLocalInput = (): string => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

export const toDatetimeLocalInputValue = (isoString: string): string => {
  const date = new Date(isoString)
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

export const nowForDateInput = (): string => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

export const nowForTimeInput = (): string => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(11, 16)
}

// All of the following treat a "YYYY-MM-DD" string as a plain calendar date
// with no timezone, never parsing it with `new Date(string)` (which treats
// it as UTC midnight and can shift the day when formatted back in a
// negative-UTC-offset timezone).

export const formatDateInputBR = (value: string): string => {
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

export const dateInputValueToLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export const localDateToDateInputValue = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}
