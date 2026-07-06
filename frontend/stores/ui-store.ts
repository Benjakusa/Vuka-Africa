import { create } from 'zustand';

interface UIState {
  mobileMenuOpen: boolean;
  paymentModal: {
    open: boolean;
    type: 'enrolment' | 'verification';
    referenceId?: string;
    amount?: number;
    phone?: string;
  } | null;
  setMobileMenuOpen: (open: boolean) => void;
  openPaymentModal: (data: { type: 'enrolment' | 'verification'; referenceId: string; amount: number; phone?: string }) => void;
  closePaymentModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  paymentModal: null,

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  openPaymentModal: (data) => set({ paymentModal: { ...data, open: true } }),

  closePaymentModal: () => set({ paymentModal: null }),
}));
