// Defontana-shopify

interface SistemasDefonta {
    defontana_token: DefontanaToken
    customers: DefontanaCustomer
    migrations: Migrations
    storage_assigns: StorageAssigns
    orders: Orders
    bussiness_centers: BussinessCenters
    errors: Errors
    users: Users
}

//-------------------------------------------------

interface DefontanaToken {
    _id: string,
    token: string,
    type: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface DefontanaCustomer {
    _id: string, // ObjectId
    email: string,
    firstName: string,
    lastName: string,
    company: string,
    address1: string,
    city: string,
    province: string,
    country: string,
    phone: string,
    inDefontana: boolean, // boolean? tinyint(1) revisar
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Migrations {
    _id:string, //ObjectId?? bigint(11) unsigned revisar
    migration: string,
    batch: number,
}

//-------------------------------------------------

//asociados por id, en distintas colecciones
interface StorageAssigns {
    _id: string, //ObjectId?? bigint(11) unsigned revisar
    shopifyStorageId: string, //objectId
    defontanaStorageId: string, //objectId
    createdAt: Date,
    updatedAt: Date,
}

interface ShopifyStorageId {
    _id: string, // ObjectId
    name: string,
    address1: string,
    city: string,
    active: number, // boolean? tinyint(1) revisar 
    createdAt: Date,
    updatedAt: Date,
}

interface DefontanaStorageId {
    _id: string, // ObjectId
    code: string,
    description: string,
    saleAvaliable: string,
    active: string,
    createdAt: Date,
    updatedAt: Date,
}
//------------------------------------------------

interface Orders {
    _id: string, //ObjectId
    checkoutId: string, //ObjectId
    name: string, //ObjectId
    sourceName: string,
    deviceId: number,
    documentStatus: string,
    documentUrl: string,
    financialStatus: string,
    locationId: number, 
    defontanaOrderId: string,
    status: string,
    creditNoteStatus: string,
    creditNotes: string,
    createdAt: Date,
    updatedAt: Date,
    error: string | null, 
}

//------------------------------------------------


interface BussinessCenters {
    _id: string, //ObjectId
    code: string,
    description: string,
    active:string, //varchar(255)
    createdAt: Date,
    updatedAt: Date,
}

//------------------------------------------------

//mover a manejador de errores
interface Errors {
    _id: string, //ObjectId
    message: string,
    stackTrace: string,
    code: number, //int(11)
    file: string,
    line: number, //int(11)
    data: string,
    createdAt: Date,
    updatedAt: Date,
}

//------------------------------------------------

enum Role {
    ADMIN = 'admin',
    USER = "user"
}

interface Users {
    _id: string, //ObjectId
    name: string,
    email: string,
    role: Role,
    isActive: boolean, 
    password: string,
    rememberToken: string,
    createdAt: Date,
    updatedAt: Date,
}
