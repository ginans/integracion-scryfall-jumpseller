interface IMappedOrders {
    orderId: number;
    
    source?: {
        name?: string;
        medium?: string;
        campaign?: string;
        referralUrl?: string;
        referralCode?: string;
        userAgent?: string;
        firstPageVisited?: string;
        firstPageVisitedAt?: string;
        referralSource?: string;
        createdFrom?: string;
        createdFromAppCode?: string;
    };

    saleCreationDate: string;
    saleCompletedDate: string;
    currency: string;
    subTotal: number;
    tax: number;
    shippingTax: number;
    shipping: number;
    total: number;
    discount: number;
    shippingDiscount: number;
    fullfillmentStatus: string;
    shippingMethodName: string;
    paymentMethodName: string;
    paymentMethodType: string;
    paymentInformation: string;
    checkoutUrl: string;
    coupon: string;

    customer?: {
        id: number;
        name: string;
        email: string;
        phone: string;
        phonePrefix: string;
        ip: string;
    };

    shippingBranch?: {
        id: number;
        name: string;
    };

    shippingAddress?: {
        name: string;
        surName: string;
        address: string;
        city: string;
        region: string;
        country: string;
        streetNumber: number;
        municipality: string;
    };

    billingAddress?: {
        name: string;
        surName: string;
        address: string;
        city: string;
        region: string;
        country: string;
        streetNumber: number;
        municipality: string;
    };

    pickupAddress?: {
        name: string;
        surName: string;
        address: string;
        city: string;
        region: string;
        country: string;
        streetNumber: number;
        municipality: string;
        pickUpPlaceName: string;
    };

    products?: {
        id: number;
        variantId: number;
        sku: string;
        name: string;
        image: string;
        qty: number;
        price: number;
        discount: number;
        taxes: {
            id: number;
            name: string;
            rate: number;
        }[];
        stockLocations: {
            locationId: number;
            stock: number;
        }[];
    }[];

    shippingTaxes?: {
        id: number;
        name: string;
        country: string;
        region: string;
        rate: number;
    }[];

    statusJumpseller?: string;
    statusJumpsellerName?: string;
    statusJumpsellerEnum?: string;
    trackingUrl?: string;
    trackingNumber?: string;
    shippingOption?: string;
    sameDayDelivery?: boolean;
    shipmentStatus?: string;
    shipmentStatusEnum?: string;
    recoveredFrom?: number;

    billingInformation?: {
        businessActivity: string;
        companyName: string;
        taxpayerType: string;
    };
}
