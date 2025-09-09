import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import StreamVideoProvider from './provider/StreamVideoProvider.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';


// error boundary 
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please reload the app to continue.
            </p>

            {/* Reload Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <StreamVideoProvider>
        <App />
      </StreamVideoProvider>
    </ErrorBoundary>
  </BrowserRouter>
)


