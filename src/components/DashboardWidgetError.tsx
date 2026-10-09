'use client'

import React, { Component, type ReactNode } from 'react'
import { IconAlert, IconCheck } from '@/components/icons'

interface Props {
  children: ReactNode
  title?: string
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class DashboardWidgetError extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DashboardWidgetError caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className={`rounded-2xl border border-red/20 bg-red-soft/40 p-5 text-center shadow-xs ${this.props.className || ''}`}>
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-soft text-red mb-3">
            <IconAlert size={20} strokeWidth={2} />
          </div>
          <h3 className="font-display text-sm font-semibold text-red">
            {this.props.title || 'Widget Unavailable'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Could not load this dashboard component. The rest of your workspace remains operational.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red/30 bg-card px-3 py-1.5 text-xs font-semibold text-red shadow-2xs hover:bg-secondary transition-colors"
          >
            <IconCheck size={14} strokeWidth={2} />
            <span>Retry Loading</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
