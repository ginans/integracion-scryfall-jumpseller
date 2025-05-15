export interface UpdateCustomFieldResponse {
    custom_field: {
        id: number;
        label: string;
        type: string;
        values: string[];
        product_visibility: boolean;
    }
}
