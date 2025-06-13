export interface CreateCustomFieldResponse {
    custom_field: {
        id: number;
        label: string;
        type: string;
        product_visibility: boolean;
        values: string[];
    };
}