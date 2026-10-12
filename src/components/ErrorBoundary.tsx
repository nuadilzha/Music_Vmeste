import { Component, type ReactNode, type ErrorInfo } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="startup">
          <h1>Не удалось открыть страницу</h1>
          <p>Обновите страницу и попробуйте ещё раз.</p>
          <a href="/" className="primary-btn">
            На главную
          </a>
        </div>
      );
    return this.props.children;
  }
}
