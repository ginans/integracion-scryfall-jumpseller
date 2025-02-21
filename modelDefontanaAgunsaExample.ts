//bluexpress- defontana

interface sistemas_umadev {
    inventoryLogs: InventoryLogs
    migrations: Migrations
    sessions: Sessions
    transactions: Transactions
    information: Information
    accounts: Accounts
    token: Token
    users: Users
    businessCenters: BusinessCenters
    detailLogs: DetailLogs
    configs: Configs
    products: Products
    agunsaNotifications: AgunsaNotifications
    stocks: Stocks
    warehouses: Warehouses
}

interface InventoryLogs {
    _id: string, //ObjectId
    transactionDate: Date,
    docNumber: string,
    entityCode: string,
    entityName: string,
    shopifyOrder: string,
    documentType: string,
    documentDate: Date,
    backupDocumentCode: string,
    backupDocumentNumber: string,
    observations: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Migrations {
    _id: string, //ObjectId
    migration: string,
    batch: number,
}

//-------------------------------------------------

interface Sessions {
    _id: string, //ObjectId
    userId: number, // int64, bigint(20) unsigned
    ipAddress: string,
    userAgent: string,
    payload: string,
    last_activity: number, // int(11)
}

//-------------------------------------------------

interface Transactions {
    _id: string, //ObjectId
    docNumber: string,
    status: string,
    payload: string,
    response: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Information {
    _id: string, //ObjectId
    entity: string,
    message: string,
    status: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Accounts {
    _id: string, //ObjectId
    name: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Token {
    _id: string, //ObjectId
    AccessToken: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------


interface Users {
    _id: string, //ObjectId
    firstName: string,
    lastName: string,
    email: string,
    role: Role,
    password: string,
    isActive: boolean, 
    rememberToken: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
}

//-------------------------------------------------

interface BusinessCenters {
    _id: string, //ObjectId
    code: string,
    description: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface DetailLogs {
    _id: string, //ObjectId
    docNumber: string,
    type: string,
    code: string,
    name: string,
    line: string,
    qty: number, //int(11)
    batchOrigin: string,
    batchOriginDate: Date,
    batchDestination: string,
    batchDestinationDate: Date,
    barCode: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Configs {
    _id: string, //ObjectId
    businessCenter: string,
    enableNotification: string,
    emailNotification: string,
    createdAt: Date,
    updatedAt: Date,
}


//-------------------------------------------------

interface Products {
    _id: string, //ObjectId
    productCode: string,
    productNameDefontana: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface AgunsaNotifications {
    _id: string, 
    document: number,
    data: string,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Stocks {
    _id: string, 
    productCode: string,
    productName: string,
    batchCode: string,
    currentStock: number,
    toBeDispatched: number,
    createdAt: Date,
    updatedAt: Date,
}

//-------------------------------------------------

interface Warehouses {
    _id: string, 
    defontanaCode: string,
    description: string,
    agunsaCode: string,
    createdAt: Date,
    updatedAt: Date,
}