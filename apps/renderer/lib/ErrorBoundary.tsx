"use client";
import React from "react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '1rem', background: '#fee', border: '1px solid #f00', borderRadius: '4px' }}>
                    <h3>❌ Error en componente</h3>
                    <pre style={{ fontSize: '0.875rem' }}>{this.state.error?.message}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
