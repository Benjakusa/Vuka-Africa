import { type ClassValue } from 'clsx';
export declare function cn(...inputs: ClassValue[]): string;
export declare function formatCurrency(amount: number | string | {
    toString(): string;
}): string;
export declare function formatDate(date: string | Date): string;
export declare function formatDateTime(date: string | Date): string;
export declare function timeAgo(date: string | Date): string;
export declare function getInitials(name: string): string;
