import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Toast } from './Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Guard against rapid successive calls overriding each other before the
  // animation cycle completes — hide first, then show after one tick.
  const pendingRef = useRef<{ message: string; type: ToastType } | null>(null);
  const isAnimatingRef = useRef(false);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (isAnimatingRef.current) {
      // Queue the latest request; it will be shown after the current one hides
      pendingRef.current = { message, type };
      // Hide the current toast immediately so the hide callback fires soon
      setToast((prev) => ({ ...prev, visible: false }));
      return;
    }
    isAnimatingRef.current = true;
    setToast({ message, type, visible: true });
  }, []);

  const handleHide = useCallback(() => {
    isAnimatingRef.current = false;
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      // Small delay so React can settle the state before showing next toast
      setTimeout(() => {
        isAnimatingRef.current = true;
        setToast({ message: pending.message, type: pending.type, visible: true });
      }, 50);
    } else {
      setToast((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const value: ToastContextValue = {
    show,
    error: useCallback((message: string) => show(message, 'error'), [show]),
    success: useCallback((message: string) => show(message, 'success'), [show]),
    info: useCallback((message: string) => show(message, 'info'), [show]),
  };

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={handleHide}
        />
      </View>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return ctx;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
