import { create } from 'zustand';

interface PaymentModalData {
  open: boolean;
  type: 'enrolment' | 'verification';
  referenceId: string;
  amount: number;
  phone?: string;
}

interface UIState {
  mobileMenuOpen: boolean;
  paymentModal: PaymentModalData | null;
  setMobileMenuOpen: (open: boolean) => void;
  openPaymentModal: (data: Omit<PaymentModalData, 'open'>) => void;
  closePaymentModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  paymentModal: null,

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  openPaymentModal: (data) =>
    set({ paymentModal: { ...data, open: true } }),

  closePaymentModal: () => set({ paymentModal: null }),
}));