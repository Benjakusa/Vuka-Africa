interface RaiseDisputeInput {
    enrolmentId: string;
    userId: string;
    reason: string;
    milestoneId?: string;
}
export declare function raiseDispute(input: RaiseDisputeInput): Promise<any>;
export declare function getDisputesForEnrolment(enrolmentId: string, userId: string): Promise<any>;
export {};
