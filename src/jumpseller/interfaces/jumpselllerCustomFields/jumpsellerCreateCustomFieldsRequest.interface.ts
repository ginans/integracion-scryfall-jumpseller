export interface JumpsellerCreateCustomFieldsRequest {
    field: {
        id: number;
        value: string;
        variants: number[]; //Array of unique identifiers of the Product Variant
    };
}
