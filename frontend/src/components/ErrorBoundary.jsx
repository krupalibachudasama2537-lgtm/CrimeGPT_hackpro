import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-3">
          <p className="text-red-400 font-bold text-sm">Component Error</p>
          <p className="text-slate-400 text-xs">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-4 py-1.5 rounded-lg"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
