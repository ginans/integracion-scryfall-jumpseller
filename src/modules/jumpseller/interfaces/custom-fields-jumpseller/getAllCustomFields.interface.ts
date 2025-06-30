export interface JumpsellerCustomField {
    id: number;
    label: string;
    type: string;
    product_visibility: boolean;
}

export interface GetAllCustomFieldResponse {
    custom_fields: JumpsellerCustomField[];
}