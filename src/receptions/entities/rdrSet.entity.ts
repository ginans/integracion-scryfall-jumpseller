import { Prop } from "@nestjs/mongoose";

export class RdrSet {
@Prop({ 
    required: true, 
})
sku: string;

@Prop({ 
    required: true 
})
description: string;

@Prop({ 
    required: true 
})
shipPrice: number;

@Prop({ 
    required: true 
})
requestedQty: number;

@Prop({ 
    required: true 
})
receivedQty: number;
}