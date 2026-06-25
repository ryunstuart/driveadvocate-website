import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

  Client: a.model({
    email: a.string().required(),
    firstName: a.string().required(),
    lastName: a.string().required(),
    phone: a.string(),
    zipCode: a.string(),
    profileCompleted: a.boolean(),
    onboardingCompleted: a.boolean(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
    allow.owner().to(['create', 'read', 'update']),
  ]),

  VehiclePreference: a.model({
    dealId: a.string().required(),
    year: a.string(),
    make: a.string(),
    model: a.string(),
    trim: a.string(),
    condition: a.string(),
    exteriorColors: a.string().array(),
    interiorColors: a.string().array(),
    accessories: a.string().array(),
    budget: a.string(),
    searchRadius: a.integer(),
    zipCode: a.string(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
    allow.owner().to(['create', 'read']),
  ]),

  CallLog: a.model({
    dealId: a.string().required(),
    dealershipId: a.string(),
    dealershipName: a.string().required(),
    advocateId: a.string(),
    contactName: a.string(),
    outcome: a.string().required(),
    notes: a.string(),
    rating: a.integer().required(),
    vinDiscussed: a.string(),
    priceDiscussed: a.float(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
  ]),

  Offer: a.model({
    dealId: a.string().required(),
    dealershipId: a.string(),
    dealershipName: a.string().required(),
    vin: a.string(),
    quotedPrice: a.float().required(),
    msrp: a.float(),
    discount: a.float(),
    kbbValue: a.float(),
    status: a.enum(['Pending', 'Best', 'Rejected']),
    notes: a.string(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
    allow.owner().to(['read']),
  ]),

  Deal: a.model({
    clientId: a.string().required(),
    clientName: a.string().required(),
    clientEmail: a.string(),
    advocateId: a.string(),
    status: a.enum(['New', 'InProgress', 'FollowUp', 'OfferReceived', 'Complete', 'Dead']),
    priority: a.integer(),
    serviceLevel: a.string(),
    budget: a.string(),
    timeline: a.string(),
    searchRadius: a.integer(),
    notes: a.string(),
    totalTimeMinutes: a.integer(),
    submittedAt: a.string(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
    allow.owner().to(['create', 'read']),
    allow.guest().to(['read']),
  ]),

  Dealership: a.model({
    name: a.string().required(),
    make: a.string(),
    address: a.string(),
    city: a.string(),
    state: a.string(),
    zipCode: a.string(),
    phone: a.string(),
    latitude: a.float(),
    longitude: a.float(),
    avgRating: a.float(),
    totalCalls: a.integer(),
    isActive: a.boolean(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
  ]),

  Inventory: a.model({
    vin: a.string().required(),
    stockNumber: a.string(),
    dealershipId: a.string(),
    dealershipName: a.string(),
    year: a.string(),
    make: a.string(),
    model: a.string(),
    trim: a.string(),
    exteriorColor: a.string(),
    interiorColor: a.string(),
    mileage: a.integer(),
    condition: a.string(),
    listPrice: a.float(),
    msrp: a.float(),
    kbbValue: a.float(),
    daysOnLot: a.integer(),
    packages: a.string().array(),
    photoUrls: a.string().array(),
    sourceApi: a.string(),
    listingUrl: a.string(),
    isActive: a.boolean(),
    syncedAt: a.string(),
  }).authorization(allow => [
    allow.groups(['advocates', 'admins']),
  ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});