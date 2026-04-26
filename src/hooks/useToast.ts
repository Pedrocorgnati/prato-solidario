'use client'

import { toast, type ExternalToast } from 'sonner'

type ToastOptions = ExternalToast

function success(message: string, options?: ToastOptions) {
  return toast.success(message, options)
}

function error(message: string, options?: ToastOptions) {
  return toast.error(message, options)
}

function warning(message: string, options?: ToastOptions) {
  return toast.warning(message, options)
}

function info(message: string, options?: ToastOptions) {
  return toast.info(message, options)
}

function loading(message: string, options?: ToastOptions) {
  return toast.loading(message, options)
}

function dismiss(toastId?: string | number) {
  toast.dismiss(toastId)
}

function promise<T>(
  promiseFn: Promise<T>,
  msgs: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: unknown) => string)
  },
  options?: ToastOptions,
) {
  return toast.promise(promiseFn, { ...msgs, ...options }) // RESOLVED: sonner aceita 2 args — msgs e options mesclados
}

export function useToast() {
  return { success, error, warning, info, loading, dismiss, promise }
}
