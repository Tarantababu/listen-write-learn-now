
import * as React from "react"
import {
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  duration?: number
}

// Define a type for the custom Toast options
export type Toast = Partial<
  Pick<ToasterToast, "action" | "title" | "description" | "duration" | "variant">
>

type State = {
  toasts: ToasterToast[]
}

export const toastVariants = {
  default: "border bg-background text-foreground",
  destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
  success: "border-success bg-success text-success-foreground",
  warning: "border-warning bg-warning text-warning-foreground",
  info: "border-info bg-info text-info-foreground",
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
      toastId: string
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: string
    }

function toastReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: props,
      toastId: id,
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  const toastToAdd: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss()
    },
  }

  dispatch({
    type: "ADD_TOAST",
    toast: toastToAdd,
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId: toastId! }),
  }
}

export { useToast, toast }
