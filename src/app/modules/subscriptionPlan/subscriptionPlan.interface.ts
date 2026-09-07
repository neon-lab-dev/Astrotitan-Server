export type TSubscriptionPlan = {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    numberOfConsultations: string;
    features: string[];
    isActive: boolean;
}