import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Something went wrong.</h1>
          <p className="text-[#94A3B8] mb-6 max-w-md">We encountered an unexpected error. Please try refreshing the page or navigating back home.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#38BDF8] text-[#0F172A] font-bold rounded-xl"
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
