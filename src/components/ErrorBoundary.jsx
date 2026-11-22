import React, { Component } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6 text-brand-dark">
          <div className="card-clean max-w-md w-full p-8 text-center bg-white rounded-[20px] border border-[#152A32]/10 shadow-soft">
            <div className="w-14 h-14 rounded-full bg-brand-terracotta/12 text-brand-terracotta flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h1 className="text-xl font-bold text-brand-dark mb-2">Щось пішло не так</h1>
            <p className="text-sm text-brand-dark/70 mb-6 leading-relaxed">
              Виникла неочікувана помилка при відображенні сторінки. Ми вже працюємо над її виправленням.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary flex-1 h-[46px] text-sm font-semibold"
              >
                <RotateCcw size={16} />
                <span>Спробувати ще раз</span>
              </button>
              <a
                href="/"
                className="btn-secondary flex-1 h-[46px] text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Home size={16} />
                <span>На головну</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
