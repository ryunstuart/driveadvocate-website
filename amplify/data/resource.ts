import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendClientUpdate } from '../functions/sendClientUpdate/resource';
import { searchDealInventory } from '../functions/searchDealInventory/resource';
import { sendEnrollment } from '../functions/sendEnrollment/resource';
import { confirmClientSignup } from '../functions/confirmClientSignup/resource';
import { getPendingCall } from '../functions/getPendingCall/resource';
import { getCallsByDate } from '../functions/getCallsByDate/resource';
import { getCallById } from '../functions/getCallById/resource';
import { updateCall } from '../functions/updateCall/resource';
import { getCatalog } from '../functions/getCatalog/resource';
import { getOnboardingToken } from '../functions/getOnboardingToken/resource';
import { createStripeCheckout } from '../functions/createStripeCheckout/resource';
import { signAgreement } from '../functions/signAgreement/resource';
import { createClientAccount } from '../functions/createClientAccount/resource';

const schema = a.schema({

  Client: a.model({
    email: a.string().required(),
    firstName: a.string().required(),
    lastName: a.string().required(),
    phone: a.string(),
    zipCode: a.string(),
    profileCompleted: a.boolean(),
    onboardingCompleted: a.boolean(),
    emailNotifications: a.boolean(),
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
    colorCombos: a.string().array(),
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
    status: a.enum(['Pending', 'New', 'InProgress', 'FollowUp', 'OfferReceived', 'Complete', 'Dead']),
    priority: a.integer(),
    serviceLevel: a.string(),
    budget: a.string(),
    timeline: a.string(),
    searchRadius: a.integer(),
    notes: a.string(),
    totalTimeMinutes: a.integer(),
    submittedAt: a.string(),
    financialProfile: a.string(),
    agreementAccepted: a.boolean(),
    agreementAcceptedAt: a.string(),
    agreementVersion: a.string(),
    stripeSessionId: a.string(),
    stripePaymentStatus: a.string(),
    enrollmentToken: a.string(),
    callId: a.string(),
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

  sendClientUpdate: a
    .mutation()
    .arguments({
      dealId: a.string().required(),
      message: a.string().required(),
      advocateName: a.string(),
    })
    .returns(a.customType({
      success: a.boolean(),
      error: a.string(),
    }))
    .authorization(allow => [allow.groups(['advocates', 'admins'])])
    .handler(a.handler.function(sendClientUpdate)),

  searchDealInventory: a
    .mutation()
    .arguments({
      dealId: a.string().required(),
      make: a.string().required(),
      model: a.string().required(),
      year: a.string(),
      zip: a.string().required(),
      radius: a.integer(),
      carType: a.string(),
    })
    .returns(a.customType({
      success: a.boolean(),
      resultCount: a.integer(),
      error: a.string(),
    }))
    .authorization(allow => [
      allow.groups(['advocates', 'admins']),
      allow.authenticated(),
    ])
    .handler(a.handler.function(searchDealInventory)),

  sendEnrollmentLink: a
    .mutation()
    .arguments({
      callId: a.string().required(),
      dealId: a.string().required(),
      advocateId: a.string(),
    })
    .returns(a.customType({
      success: a.boolean(),
      token: a.string(),
      enrollmentUrl: a.string(),
      error: a.string(),
    }))
    .authorization(allow => [allow.groups(['advocates', 'admins'])])
    .handler(a.handler.function(sendEnrollment)),

  confirmClientSignup: a
    .mutation()
    .arguments({ email: a.string().required() })
    .returns(a.customType({ confirmed: a.boolean(), error: a.string() }))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(confirmClientSignup)),

  getPendingCall: a
    .query()
    .arguments({ email: a.string().required() })
    .returns(a.customType({
      callId: a.string(),
      clientName: a.string(),
      clientEmail: a.string(),
      clientPhone: a.string(),
      scheduledAt: a.string(),
      status: a.string(),
      notes: a.string(),
    }))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(getPendingCall)),

  getCallsByDate: a
    .query()
    .arguments({ date: a.string().required() })
    .returns(a.string())
    .authorization(allow => [allow.groups(['advocates', 'admins'])])
    .handler(a.handler.function(getCallsByDate)),

  getCallById: a
    .query()
    .arguments({ callId: a.string().required() })
    .returns(a.customType({
      callId: a.string(),
      clientName: a.string(),
      clientEmail: a.string(),
      clientPhone: a.string(),
      clientZip: a.string(),
      scheduledAt: a.string(),
      status: a.string(),
      notes: a.string(),
    }))
    .authorization(allow => [allow.groups(['advocates', 'admins'])])
    .handler(a.handler.function(getCallById)),

  updateCall: a
    .mutation()
    .arguments({ callId: a.string().required(), status: a.string(), notes: a.string() })
    .returns(a.string())
    .authorization(allow => [allow.groups(['advocates', 'admins'])])
    .handler(a.handler.function(updateCall)),

  getCatalog: a
    .query()
    .arguments({})
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(getCatalog)),

  getOnboardingToken: a
    .query()
    .arguments({ token: a.string().required() })
    .returns(a.customType({
      token: a.string(),
      clientEmail: a.string(),
      clientName: a.string(),
      dealId: a.string(),
      callId: a.string(),
      expiresAt: a.string(),
      used: a.boolean(),
      agreementAccepted: a.boolean(),
      paymentStatus: a.string(),
    }))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(getOnboardingToken)),

  createStripeCheckout: a
    .mutation()
    .arguments({
      token: a.string().required(),
      dealId: a.string().required(),
      clientEmail: a.string().required(),
      clientName: a.string().required(),
    })
    .returns(a.customType({ url: a.string(), error: a.string() }))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(createStripeCheckout)),

  signAgreement: a
    .mutation()
    .arguments({ token: a.string().required(), ipAddress: a.string() })
    .returns(a.customType({ success: a.boolean() }))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(signAgreement)),

  createClientAccount: a
    .mutation()
    .arguments({
      email: a.string().required(),
      password: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phone: a.string(),
    })
    .returns(a.customType({ success: a.boolean(), error: a.string() }))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(createClientAccount)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});