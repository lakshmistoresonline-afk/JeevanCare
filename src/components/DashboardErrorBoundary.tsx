'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from './primitives'

interface Props {
  children: ReactNode
  widgetName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error in widget [${this.props.widgetName || 'Widget'}]:`, error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center space-y-3 border-red/30 bg-red-soft/20">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-red-soft text-red font-bold text-sm">
            !
          </span>
          <h3 className="font-display text-sm font-bold text-ink">
            Unable to load {this.props.widgetName || 'this component'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            An unexpected error occurred while rendering this section. Your data remains secure.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
          >
            Reload Component
          </button>
        </Card>
      )
    }

    return this.props.children
  }
}
