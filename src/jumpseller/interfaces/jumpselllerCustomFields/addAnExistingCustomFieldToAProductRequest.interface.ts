export interface AddAnExistingCustomFieldToAProductRequest {
    field: {
        id: number;
        value: string;
        variants: number[];
    };
}
