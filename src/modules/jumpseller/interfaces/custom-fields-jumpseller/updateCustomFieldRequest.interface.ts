export interface UpdateCustomFieldRequest {
    custom_field: {
        label: string;
        type: string;
        values: string[];
        product_visibility: boolean;
    }
}
