'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { dataClient } from '@/app/lib/amplify-data';
import { calculatePricing, generateNegotiationScript, getBestCallTime } from '@/app/lib/negotiation';

interface Dealership {
  id: number;
  name: string;
  distance: number;
  phone: string;
  status: 'Not Called' | 'Called' | 'Follow Up' | 'No Inventory';
  lastCalled?: string;
  lastOutcome?: string;
  lastRating?: number;
  contactName?: string;
}

interface InventoryListing {
  vin: string;
  heading: string;
  price: number;
  originalPrice: number;
  msrp: number;
  miles: number;
  exteriorColor: string;
  interiorColor: string;
  daysOnLot: number;
  priceDropAmount: number;
  marketAvgPrice: number;
  belowMarketAvg: boolean;
  dealerName: string;
  dealerPhone: string;
  dealerAddress: string;
  dealerCity: string;
  dealerState: string;
  stockNumber: string;
  listingUrl: string;
  photoUrl: string;
  colorComboMatch: number | null;
  colorMatchLabel: string | null;
}

interface CallLog {
  id: string;
  dealershipId: string;
  dealershipName: string;
  contactName: string;
  timestamp: string;
  outcome: string;
  notes: string;
  rating: number;
}

interface Offer {
  id: string;
  dealershipName: string;
  price: string;
  msrp: string;
  discount: string;
  notes: string;
  timestamp: string;
  status: 'Pending' | 'Best' | 'Rejected';
}

type DealStatus = 'New' | 'In Progress' | 'Follow Up' | 'Offer Received' | 'Complete' | 'Dead';

const STATUS_TO_APPSYNC: Record<DealStatus, string> = {
  'New': 'New', 'In Progress': 'InProgress', 'Follow Up': 'FollowUp',
  'Offer Received': 'OfferReceived', 'Complete': 'Complete', 'Dead': 'Dead',
};
const STATUS_FROM_APPSYNC: Record<string, DealStatus> = {
  'New': 'New', 'InProgress': 'In Progress', 'FollowUp': 'Follow Up',
  'OfferReceived': 'Offer Received', 'Complete': 'Complete', 'Dead': 'Dead',
};

const OUTCOMES = [
  'Vehicle in stock — price quoted', 'Vehicle in stock — no price yet',
  'Vehicle incoming — ETA given', 'Vehicle not in stock',
  'Left voicemail', 'No answer', 'Spoke to manager',
  'Sent email follow-up', 'Deal agreed — pending approval',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent',
};

const DEAL_STATUSES: DealStatus[] = ['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete', 'Dead'];

const STATUS_COLORS: Record<DealStatus, string> = {
  'New': 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Follow Up': 'bg-purple-100 text-purple-700 border-purple-200',
  'Offer Received': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Complete': 'bg-slate-100 text-slate-700 border-slate-200',
  'Dead': 'bg-red-100 text-red-600 border-red-200',
};

const MOCK_DEALS: Record<string, { clientName: string; vehicle: string; vehicleDetails: string; dealerships: Dealership[] }> = {
  'deal-001': {
    clientName: 'Johnathan Reyes', vehicle: '2025 Toyota Tundra Limited',
    vehicleDetails: '4x4 CrewMax • Midnight Black • Black Leather',
    dealerships: [
      { id: 1, name: 'Toyota of St. Charles', distance: 4.2, phone: '(636) 555-0123', status: 'Not Called' },
      { id: 2, name: 'Suntrup Toyota', distance: 7.8, phone: '(314) 555-0199', status: 'Not Called' },
      { id: 3, name: 'Lou Fusz Toyota', distance: 12.1, phone: '(314) 555-0145', status: 'Not Called' },
      { id: 4, name: 'Frank Leta Toyota', distance: 15.4, phone: '(636) 555-0177', status: 'Not Called' },
      { id: 5, name: 'Toyota South', distance: 22.6, phone: '(618) 555-0133', status: 'Not Called' },
    ],
  },
  'deal-002': {
    clientName: 'Maria Gonzalez', vehicle: '2026 Ford F-150 Lariat',
    vehicleDetails: '4x4 SuperCrew • Rapid Red • Medium Dark Ash',
    dealerships: [
      { id: 1, name: 'Bommarito Ford', distance: 6.1, phone: '(636) 555-0211', status: 'Not Called' },
      { id: 2, name: 'Plaza Ford', distance: 9.4, phone: '(314) 555-0244', status: 'Not Called' },
      { id: 3, name: "O'Fallon Ford", distance: 11.2, phone: '(636) 555-0288', status: 'Not Called' },
      { id: 4, name: 'Auffenberg Ford', distance: 18.7, phone: '(618) 555-0255', status: 'Not Called' },
    ],
  },
  'deal-003': {
    clientName: 'David Chen', vehicle: '2025 Chevrolet Silverado 1500',
    vehicleDetails: 'LTZ Z71 • Northsky Blue • Jet Black',
    dealerships: [
      { id: 1, name: 'Mungenast Chevrolet', distance: 5.3, phone: '(314) 555-0301', status: 'Not Called' },
      { id: 2, name: 'Bommarito Chevrolet', distance: 8.9, phone: '(636) 555-0322', status: 'Not Called' },
      { id: 3, name: 'Thoroughbred Chevrolet', distance: 14.2, phone: '(636) 555-0355', status: 'Not Called' },
    ],
  },
  'deal-004': {
    clientName: 'Sarah Patel', vehicle: '2025 Ram 1500 Limited',
    vehicleDetails: 'Crew Cab 4x4 • Diamond Black • Black/Brown',
    dealerships: [
      { id: 1, name: 'Suntrup Buick GMC', distance: 7.1, phone: '(314) 555-0401', status: 'Not Called' },
      { id: 2, name: 'Laura Buick GMC', distance: 10.5, phone: '(636) 555-0422', status: 'Not Called' },
      { id: 3, name: 'Auffenberg Chrysler Dodge Jeep Ram', distance: 16.3, phone: '(618) 555-0455', status: 'Not Called' },
    ],
  },
};

function formatPrice(num: number): string {
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function parsePrice(str: string): number {
  return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
}

export default function ClientDealFile() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAppSyncDeal, setIsAppSyncDeal] = useState(false);
  const [dealInfo, setDealInfo] = useState({ clientName: '', vehicle: '', vehicleDetails: '' });
  const [vehiclePref, setVehiclePref] = useState<{ make: string; model: string; year: string; zipCode: string; searchRadius: number } | null>(null);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [inventory, setInventory] = useState<InventoryListing[]>([]);
  const [inventorySearching, setInventorySearching] = useState(false);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [dealStatus, setDealStatus] = useState<DealStatus>('New');
  const [isWorking, setIsWorking] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [contactName, setContactName] = useState('');
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [callNotes, setCallNotes] = useState('');
  const [callRating, setCallRating] = useState(3);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerDealership, setOfferDealership] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMsrp, setOfferMsrp] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeSavings, setCompleteSavings] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);

  const loadLocalState = useCallback(() => {
    try {
      const saved = localStorage.getItem(`dealfile-${dealId}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, [dealId]);

  // Load data from AppSync or fall back to mock
  useEffect(() => {
    async function load() {
      try {
        const [dealResult, callLogsResult, offersResult, vpResult] = await Promise.all([
          dataClient.models.Deal.get({ id: dealId }),
          dataClient.models.CallLog.list({ filter: { dealId: { eq: dealId } } }),
          dataClient.models.Offer.list({ filter: { dealId: { eq: dealId } } }),
          dataClient.models.VehiclePreference.list({ filter: { dealId: { eq: dealId } } }),
        ]);

        if (dealResult.data) {
          setIsAppSyncDeal(true);
          const d = dealResult.data;

          let vehicle = 'Vehicle TBD';
          let vehicleDetails = '';
          if (vpResult.data.length > 0) {
            const vp = vpResult.data[0];
            vehicle = [vp.year, vp.make, vp.model, vp.trim].filter(Boolean).join(' ') || 'Vehicle TBD';
            const ext = (vp.exteriorColors || []).join(', ');
            const int = (vp.interiorColors || []).join(', ');
            vehicleDetails = [ext && `${ext} Ext`, int && `${int} Int`].filter(Boolean).join(' • ');
            if (vp.make && vp.model && vp.zipCode) {
              setVehiclePref({
                make: vp.make, model: vp.model,
                year: vp.year || '2020',
                zipCode: vp.zipCode,
                searchRadius: vp.searchRadius || 100,
              });
            }
          }
          setDealInfo({ clientName: d.clientName, vehicle, vehicleDetails });

          const mappedLogs: CallLog[] = (callLogsResult.data || []).map(cl => ({
            id: cl.id,
            dealershipId: cl.dealershipId || '',
            dealershipName: cl.dealershipName,
            contactName: cl.contactName || '',
            timestamp: cl.createdAt ? new Date(cl.createdAt).toLocaleString() : '',
            outcome: cl.outcome,
            notes: cl.notes || '',
            rating: cl.rating,
          })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setCallLogs(mappedLogs);

          const mappedOffers: Offer[] = (offersResult.data || []).map(o => {
            const price = o.quotedPrice;
            const msrp = o.msrp || 0;
            const disc = msrp && price ? msrp - price : 0;
            return {
              id: o.id,
              dealershipName: o.dealershipName,
              price: formatPrice(price),
              msrp: msrp ? formatPrice(msrp) : '',
              discount: disc > 0 ? `${formatPrice(disc)} below MSRP` : '',
              notes: o.notes || '',
              timestamp: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
              status: (o.status as Offer['status']) || 'Pending',
            };
          }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setOffers(mappedOffers);

          const localState = loadLocalState();
          setTotalTime(localState?.totalTime ?? d.totalTimeMinutes ?? 0);
          lastSyncTime.current = localState?.totalTime ?? d.totalTimeMinutes ?? 0;
          setDealStatus(STATUS_FROM_APPSYNC[d.status || 'New'] || 'New');
          setDealerships(localState?.dealerships || []);

          try {
            const invRes = await fetch(`/api/inventory?dealId=${dealId}`);
            if (invRes.ok) {
              const invData = await invRes.json();
              setInventory(invData.listings || []);
            }
          } catch {}

          if (vpResult.data.length > 0) {
            const vp = vpResult.data[0];
            try {
              const incRes = await fetch(`/api/incentives?makeModel=${encodeURIComponent(`${vp.make}#${vp.model}#${vp.year || '2026'}`)}`);
              if (incRes.ok) {
                const incData = await incRes.json();
                const today = new Date().toISOString().split('T')[0];
                setIncentives((incData.incentives || []).filter((i: any) => i.expiresAt >= today));
              }
            } catch {}
          }

        } else {
          // Fall back to mock data for old hardcoded deal IDs
          const mock = MOCK_DEALS[dealId] || MOCK_DEALS['deal-001'];
          const localState = loadLocalState();
          setDealInfo({ clientName: mock.clientName, vehicle: mock.vehicle, vehicleDetails: mock.vehicleDetails });
          setDealerships(localState?.dealerships || mock.dealerships);
          setCallLogs(localState?.callLogs || []);
          setOffers(localState?.offers || []);
          setTotalTime(localState?.totalTime || 0);
          setDealStatus(localState?.dealStatus || 'New');
        }
      } catch (err) {
        console.error('Failed to load deal from AppSync, falling back to mock', err);
        const mock = MOCK_DEALS[dealId] || MOCK_DEALS['deal-001'];
        const localState = loadLocalState();
        setDealInfo({ clientName: mock.clientName, vehicle: mock.vehicle, vehicleDetails: mock.vehicleDetails });
        setDealerships(localState?.dealerships || mock.dealerships);
        setCallLogs(localState?.callLogs || []);
        setOffers(localState?.offers || []);
        setTotalTime(localState?.totalTime || 0);
        setDealStatus(localState?.dealStatus || 'New');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [dealId, loadLocalState]);

  // Auto-start timer after loading
  useEffect(() => {
    if (isLoading) return;
    setIsWorking(true);
    timerRef.current = setInterval(() => setTotalTime(prev => prev + 1), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLoading]);

  // Persist state to localStorage + debounced AppSync sync for timer
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    const state = {
      totalTime, callLogs, dealerships, offers, dealStatus,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`dealfile-${dealId}`, JSON.stringify(state));

    if (isAppSyncDeal && totalTime - lastSyncTime.current >= 5 && totalTime > 0) {
      lastSyncTime.current = totalTime;
      dataClient.models.Deal.update({ id: dealId, totalTimeMinutes: totalTime }).catch(console.error);
    }
  }, [totalTime, callLogs, dealerships, offers, dealStatus, dealId, isAppSyncDeal, isLoading]);

  const toggleTimer = () => {
    if (isWorking) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsWorking(false);
    } else {
      timerRef.current = setInterval(() => setTotalTime(prev => prev + 1), 60000);
      setIsWorking(true);
    }
  };

  const formatTime = (mins: number) => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const openCallModal = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setContactName('');
    setOutcome(OUTCOMES[0]);
    setCallNotes('');
    setCallRating(3);
  };

  const logCall = async () => {
    if (!selectedDealership) return;

    if (isAppSyncDeal) {
      try {
        await dataClient.models.CallLog.create({
          dealId,
          dealershipName: selectedDealership.name,
          contactName: contactName || undefined,
          outcome,
          notes: callNotes || undefined,
          rating: callRating,
        });
        const { data } = await dataClient.models.CallLog.list({ filter: { dealId: { eq: dealId } } });
        setCallLogs((data || []).map(cl => ({
          id: cl.id,
          dealershipId: cl.dealershipId || '',
          dealershipName: cl.dealershipName,
          contactName: cl.contactName || '',
          timestamp: cl.createdAt ? new Date(cl.createdAt).toLocaleString() : '',
          outcome: cl.outcome,
          notes: cl.notes || '',
          rating: cl.rating,
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error('Failed to log call to AppSync', err);
      }
    } else {
      const newLog: CallLog = {
        id: String(Date.now()), dealershipId: String(selectedDealership.id),
        dealershipName: selectedDealership.name, contactName,
        timestamp: new Date().toLocaleString(), outcome, notes: callNotes, rating: callRating,
      };
      setCallLogs(prev => [newLog, ...prev]);
    }

    const newDealerStatus: Dealership['status'] =
      outcome.includes('voicemail') || outcome.includes('No answer') || outcome.includes('follow-up') ? 'Follow Up'
      : outcome.includes('not in stock') ? 'No Inventory' : 'Called';
    setDealerships(prev => prev.map(d =>
      d.id === selectedDealership.id
        ? { ...d, status: newDealerStatus, lastCalled: new Date().toLocaleDateString(), lastOutcome: outcome, lastRating: callRating, contactName }
        : d
    ));

    if (dealStatus === 'New') {
      const newStatus: DealStatus = 'In Progress';
      setDealStatus(newStatus);
      if (isAppSyncDeal) {
        dataClient.models.Deal.update({ id: dealId, status: STATUS_TO_APPSYNC[newStatus] as any }).catch(console.error);
      }
    }
    setSelectedDealership(null);
  };

  const logOffer = async () => {
    if (!offerDealership || !offerPrice) return;
    const priceNum = parsePrice(offerPrice);
    const msrpNum = parsePrice(offerMsrp);
    const disc = msrpNum && priceNum ? msrpNum - priceNum : 0;

    if (isAppSyncDeal) {
      try {
        await dataClient.models.Offer.create({
          dealId,
          dealershipName: offerDealership,
          quotedPrice: priceNum,
          msrp: msrpNum || undefined,
          discount: disc > 0 ? disc : undefined,
          notes: offerNotes || undefined,
          status: 'Pending',
        });
        const { data } = await dataClient.models.Offer.list({ filter: { dealId: { eq: dealId } } });
        setOffers((data || []).map(o => {
          const p = o.quotedPrice;
          const m = o.msrp || 0;
          const d = m && p ? m - p : 0;
          return {
            id: o.id,
            dealershipName: o.dealershipName,
            price: formatPrice(p),
            msrp: m ? formatPrice(m) : '',
            discount: d > 0 ? `${formatPrice(d)} below MSRP` : '',
            notes: o.notes || '',
            timestamp: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
            status: (o.status as Offer['status']) || 'Pending',
          };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error('Failed to log offer to AppSync', err);
      }
    } else {
      const discountStr = disc > 0 ? `${formatPrice(disc)} below MSRP` : '';
      const newOffer: Offer = {
        id: String(Date.now()), dealershipName: offerDealership,
        price: offerPrice, msrp: offerMsrp, discount: discountStr,
        notes: offerNotes, timestamp: new Date().toLocaleString(), status: 'Pending',
      };
      setOffers(prev => [newOffer, ...prev]);
    }

    if (dealStatus !== 'Complete') {
      const newStatus: DealStatus = 'Offer Received';
      setDealStatus(newStatus);
      if (isAppSyncDeal) {
        dataClient.models.Deal.update({ id: dealId, status: STATUS_TO_APPSYNC[newStatus] as any }).catch(console.error);
      }
    }
    setShowOfferModal(false);
    setOfferDealership(''); setOfferPrice(''); setOfferMsrp(''); setOfferNotes('');
  };

  const setBestOffer = async (offerId: string) => {
    if (isAppSyncDeal) {
      try {
        const currentBest = offers.find(o => o.status === 'Best');
        if (currentBest && currentBest.id !== offerId) {
          await dataClient.models.Offer.update({ id: currentBest.id, status: 'Pending' });
        }
        await dataClient.models.Offer.update({ id: offerId, status: 'Best' });
      } catch (err) {
        console.error('Failed to update offer status', err);
      }
    }
    setOffers(prev => prev.map(o => ({
      ...o, status: o.id === offerId ? 'Best' : o.status === 'Best' ? 'Pending' : o.status,
    })));
  };

  const rejectOffer = async (offerId: string) => {
    if (isAppSyncDeal) {
      try {
        await dataClient.models.Offer.update({ id: offerId, status: 'Rejected' });
      } catch (err) {
        console.error('Failed to reject offer', err);
      }
    }
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Rejected' } : o));
  };

  const updateDealStatus = async (newStatus: DealStatus) => {
    setDealStatus(newStatus);
    setShowStatusMenu(false);
    if (isAppSyncDeal) {
      dataClient.models.Deal.update({ id: dealId, status: STATUS_TO_APPSYNC[newStatus] as any }).catch(console.error);
    }
  };

  const handleComplete = async () => {
    const newStatus: DealStatus = 'Complete';
    setDealStatus(newStatus);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsWorking(false);
    setShowCompleteModal(false);
    if (isAppSyncDeal) {
      dataClient.models.Deal.update({
        id: dealId,
        status: STATUS_TO_APPSYNC[newStatus] as any,
        totalTimeMinutes: totalTime,
        notes: completeNotes || undefined,
      }).catch(console.error);
    }
  };

  const getDefaultEmailMessage = () => {
    const statusMessages: Record<string, string> = {
      'New': `I've received your vehicle request and I'm reviewing your build now. I'll start reaching out to dealerships in your area shortly.`,
      'In Progress': `I'm actively contacting dealerships in your area. I'll update you as soon as I have pricing and availability information.`,
      'Follow Up': `I'm following up with several dealerships on your vehicle. Waiting on responses and will have an update for you soon.`,
      'Offer Received': `Great news — I've received a competitive offer on your vehicle. I'll be in touch shortly to walk through the details with you.`,
      'Complete': `Your deal is finalized! Thank you for choosing DriveAdvocate. It was a pleasure working with you.`,
      'Dead': `Your deal file has been closed. If you'd like to start a new search, feel free to reach out anytime.`,
    };
    return statusMessages[dealStatus] || 'Here\'s an update on your deal.';
  };

  const openEmailModal = () => {
    setEmailMessage(getDefaultEmailMessage());
    setEmailError('');
    setEmailSent(false);
    setShowEmailModal(true);
  };

  const sendEmail = async () => {
    if (!emailMessage.trim()) return;
    setEmailSending(true);
    setEmailError('');
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const result = await dataClient.mutations.sendClientUpdate({
        dealId,
        message: emailMessage,
        advocateName: currentUser.firstName ? `${currentUser.firstName} at DriveAdvocate` : undefined,
      });
      if (result.data?.success) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
        }, 3000);
      } else {
        setEmailError(result.data?.error || 'Failed to send email');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  const triggerInventorySearch = async () => {
    if (!vehiclePref || inventorySearching) return;
    setInventorySearching(true);
    try {
      await dataClient.mutations.searchDealInventory({
        dealId,
        make: vehiclePref.make,
        model: vehiclePref.model,
        year: vehiclePref.year,
        zip: vehiclePref.zipCode,
        radius: vehiclePref.searchRadius,
        carType: 'used',
      });
      const invRes = await fetch(`/api/inventory?dealId=${dealId}`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.listings || []);
      }
    } catch (err) {
      console.error('Inventory search failed:', err);
    } finally {
      setInventorySearching(false);
    }
  };

  const copyDealSummary = async () => {
    const lines = [
      `DEAL SUMMARY`,
      `────────────────────────────`,
      `Client: ${dealInfo.clientName}`,
      `Deal ID: ${dealId}`,
      `Status: ${dealStatus}`,
      ``,
      `Vehicle: ${dealInfo.vehicle}`,
      dealInfo.vehicleDetails ? `Details: ${dealInfo.vehicleDetails}` : '',
      ``,
      `Dealerships Contacted: ${dealerships.filter(d => d.status !== 'Not Called').length} of ${dealerships.length}`,
      `Calls Logged: ${callLogs.length}`,
      `Time on File: ${formatTime(totalTime)}`,
    ].filter(Boolean);

    if (offers.length > 0) {
      lines.push('', `OFFERS (${offers.length})`, `────────────────────────────`);
      offers.forEach(o => {
        const status = o.status === 'Best' ? ' ⭐ BEST' : o.status === 'Rejected' ? ' (Rejected)' : '';
        lines.push(`${o.dealershipName}: ${o.price}${o.discount ? ` — ${o.discount}` : ''}${status}`);
      });
    }

    lines.push('', `Generated: ${new Date().toLocaleString()}`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };

  const calledCount = dealerships.filter(d => d.status !== 'Not Called').length;
  const activeCount = dealerships.filter(d => d.status === 'Called' || d.status === 'Follow Up').length;
  const bestOffer = offers.find(o => o.status === 'Best');

  const pricing = useMemo(() => {
    if (!vehiclePref) return null;
    const avgPrice = inventory.length > 0
      ? inventory.reduce((s, i) => s + (i.price || 0), 0) / inventory.length
      : 0;
    const msrp = inventory[0]?.msrp || avgPrice || 0;
    const invoice = msrp * 0.94;
    const avgDays = inventory.length > 0
      ? Math.round(inventory.reduce((s, i) => s + (i.daysOnLot || 0), 0) / inventory.length)
      : 45;
    const totalInc = incentives.filter((i: any) => i.canStack).reduce((s: number, i: any) => s + (i.amount || 0), 0);
    if (msrp === 0) return null;
    return calculatePricing(vehiclePref.make, msrp, invoice, avgPrice || msrp, avgDays, inventory.length, totalInc);
  }, [vehiclePref, inventory, incentives]);

  const dealerStatusColors: Record<Dealership['status'], string> = {
    'Not Called': 'bg-slate-100 text-slate-600',
    'Called': 'bg-emerald-100 text-emerald-700',
    'Follow Up': 'bg-amber-100 text-amber-700',
    'No Inventory': 'bg-red-100 text-red-600',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header variant="authenticated" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading deal file...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{dealInfo.clientName}</h1>
            <p className="text-slate-600 mt-1">{dealInfo.vehicle}{dealInfo.vehicleDetails ? ` • ${dealInfo.vehicleDetails}` : ''}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono text-slate-400">{dealId}</span>
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`text-xs px-3 py-1 rounded-full font-medium border transition hover:opacity-80 ${STATUS_COLORS[dealStatus]}`}
                >
                  {dealStatus} ▾
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 top-8 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 min-w-[160px]">
                    {DEAL_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => updateDealStatus(s)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${dealStatus === s ? 'font-semibold' : ''}`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          s === 'New' ? 'bg-blue-400' : s === 'In Progress' ? 'bg-amber-400' :
                          s === 'Follow Up' ? 'bg-purple-400' : s === 'Offer Received' ? 'bg-emerald-400' :
                          s === 'Complete' ? 'bg-slate-400' : 'bg-red-400'
                        }`} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className={`bg-white rounded-2xl shadow px-6 py-4 text-center border-2 transition ${isWorking ? 'border-emerald-400' : 'border-transparent'}`}>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Time on File</div>
              <div className="text-3xl font-bold font-mono">{formatTime(totalTime)}</div>
              {isWorking && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-600 font-medium">Tracking</span>
                </div>
              )}
            </div>
            <button onClick={toggleTimer} className={`px-5 py-3 rounded-2xl font-medium transition text-sm ${isWorking ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
              {isWorking ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Best offer banner */}
        {bestOffer && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Best Offer</span>
              <div className="font-semibold text-slate-800 mt-0.5">{bestOffer.dealershipName} — {bestOffer.price}</div>
              {bestOffer.discount && <div className="text-sm text-emerald-600">{bestOffer.discount}</div>}
            </div>
            <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-medium">⭐ Best</span>
          </div>
        )}

        {/* Pricing Intelligence */}
        {pricing && vehiclePref && (
          <div className="bg-white rounded-3xl shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Pricing Intelligence</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                pricing.negotiationLeverage === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                pricing.negotiationLeverage === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {pricing.negotiationLeverage} LEVERAGE
              </div>
            </div>

            {pricing.leverageReasons.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-1">
                {pricing.leverageReasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500">⚡</span>{reason}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dealer Cost Breakdown</div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">MSRP</span><span className="font-medium">${pricing.msrp.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Invoice (est.)</span><span className="font-medium">${pricing.invoice.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Holdback</span><span className="font-medium text-emerald-600">-${pricing.holdback.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 font-semibold"><span>True Dealer Cost</span><span className="text-emerald-700">${pricing.trueDealerCost.toLocaleString()}</span></div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Negotiation Targets</div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Market Average</span><span className="font-medium">${pricing.marketAverage.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Target OTD</span><span className="font-medium text-blue-600">${pricing.targetPrice.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Walk Away</span><span className="font-medium text-amber-600">${pricing.walkAwayPrice.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 font-semibold"><span>Best Case</span><span className="text-emerald-700">${pricing.bestCasePrice.toLocaleString()}</span></div>
              </div>
            </div>

            {incentives.length > 0 && (
              <div className="border-t border-slate-100 pt-4 mb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Current Incentives — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="space-y-1">
                  {incentives.map((inc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${inc.canStack ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-slate-600">{inc.type}</span>
                        {inc.stackNotes && <span className="text-xs text-slate-400" title={inc.stackNotes}>ⓘ</span>}
                      </div>
                      <span className="font-semibold text-emerald-700">
                        {inc.type === 'APR Special' ? `${inc.aprRate}% / ${inc.aprMonths}mo` : `-$${inc.amount?.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-slate-100 pt-2 font-bold">
                    <span>Total Stackable</span>
                    <span className="text-emerald-700">-${pricing.totalIncentives.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-base">
                    <span>Effective Target OTD</span>
                    <span className="text-emerald-700">${pricing.effectiveTargetPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {incentives.length === 0 && (
              <div className="border-t border-slate-100 pt-3 mb-4 text-sm text-slate-400">
                No incentives on file — <a href="/admin/incentives" className="text-emerald-600 hover:underline">update at Incentives Manager</a>
              </div>
            )}

            {(() => { const ct = getBestCallTime(); return (
              <div className="bg-blue-50 rounded-2xl p-3 mb-4">
                <div className="text-xs font-semibold text-blue-700 mb-1">Best Time to Call</div>
                <div className="text-sm text-blue-600"><strong>{ct.day}</strong> — {ct.reason}</div>
              </div>
            ); })()}

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Opening Script</div>
                <button onClick={() => {
                  const script = generateNegotiationScript(
                    inventory[0]?.dealerName || '[Dealer Name]',
                    `${vehiclePref.year} ${vehiclePref.make} ${vehiclePref.model}`,
                    pricing, incentives,
                  );
                  navigator.clipboard.writeText(script);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }} className="text-xs text-emerald-600 hover:underline font-medium">
                  {copiedScript ? '✓ Copied!' : 'Copy Script'}
                </button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {generateNegotiationScript(
                  inventory[0]?.dealerName || '[Dealer Name]',
                  `${vehiclePref.year} ${vehiclePref.make} ${vehiclePref.model}`,
                  pricing, incentives,
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Inventory Listings */}
            <div className="bg-white rounded-3xl shadow p-8">
              {inventory.length > 0 ? (
                <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Inventory <span className="text-slate-400 font-normal text-base">({inventory.length} listings)</span></h2>
                  {vehiclePref && (
                    <button onClick={triggerInventorySearch} disabled={inventorySearching} className="px-4 py-2 text-sm border border-slate-200 rounded-2xl hover:border-emerald-300 hover:text-emerald-600 disabled:text-slate-400 transition">
                      {inventorySearching ? 'Refreshing...' : 'Refresh'}
                    </button>
                  )}
                </div>
                {inventory.some(l => l.colorMatchLabel === 'Color matching pending') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-sm text-amber-700">
                    Color filtering is pending — showing all inventory. Exact color matching activates after vehicle color data is imported.
                  </div>
                )}
                <div className="space-y-4">
                  {inventory.map(listing => (
                    <div key={listing.vin} className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="font-semibold">{listing.dealerName}</div>
                            {listing.colorComboMatch && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.colorComboMatch === 1 ? 'bg-emerald-100 text-emerald-700' : listing.colorComboMatch === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>✓ Combo {listing.colorComboMatch} — {listing.colorMatchLabel}</span>}
                            {listing.daysOnLot >= 30 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">30+ days</span>}
                            {listing.priceDropAmount > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Price dropped ${listing.priceDropAmount.toLocaleString()}</span>}
                            {listing.belowMarketAvg && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Below market avg</span>}
                          </div>
                          <div className="text-sm text-slate-600">{listing.heading}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {listing.dealerCity}, {listing.dealerState} · {listing.miles.toLocaleString()} mi · {listing.exteriorColor} / {listing.interiorColor}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            VIN: {listing.vin}{listing.stockNumber ? ` · Stock: ${listing.stockNumber}` : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-slate-800">${listing.price.toLocaleString()}</div>
                          {listing.originalPrice > listing.price && (
                            <div className="text-xs text-slate-400 line-through">${listing.originalPrice.toLocaleString()}</div>
                          )}
                          {listing.marketAvgPrice > 0 && (
                            <div className={`text-xs mt-0.5 font-medium ${listing.price < listing.marketAvgPrice ? 'text-emerald-600' : 'text-slate-400'}`}>
                              Avg: ${listing.marketAvgPrice.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-slate-400 mt-1">{listing.daysOnLot}d on lot</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <button onClick={() => { setOfferDealership(listing.dealerName); setOfferPrice(`$${listing.price.toLocaleString()}`); setShowOfferModal(true); }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition">+ Offer</button>
                        <button onClick={() => openCallModal({ id: Date.now(), name: listing.dealerName, distance: 0, phone: listing.dealerPhone, status: 'Not Called' })} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 transition">Log Call</button>
                        {listing.listingUrl && <a href={listing.listingUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-slate-200 text-slate-500 text-xs rounded-xl hover:border-slate-300 transition ml-auto">View Listing</a>}
                      </div>
                    </div>
                  ))}
                </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <h2 className="font-semibold text-slate-700 mb-1">No inventory loaded yet</h2>
                  <p className="text-sm text-slate-400 mb-4">
                    {vehiclePref
                      ? 'Search for matching vehicles near the client to populate this section.'
                      : 'Inventory populates when a client submits through the vehicle wizard.'}
                  </p>
                  {vehiclePref && (
                    <button
                      onClick={triggerInventorySearch}
                      disabled={inventorySearching}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700 disabled:bg-slate-300 transition"
                    >
                      {inventorySearching ? 'Searching...' : 'Search Inventory Now'}
                    </button>
                  )}
                  {inventorySearching && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                      Searching {vehiclePref?.make} {vehiclePref?.model} near {vehiclePref?.zipCode}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dealerships (localStorage) */}
            {dealerships.length > 0 && (
              <div className="bg-white rounded-3xl shadow p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Dealerships</h2>
                  <div className="text-sm text-slate-500">{calledCount} of {dealerships.length} contacted</div>
                </div>
                <div className="space-y-3">
                  {dealerships.map(dealer => (
                    <div key={dealer.id} className={`border rounded-2xl p-5 transition ${
                      dealer.status === 'Not Called' ? 'border-slate-200 hover:border-emerald-300' :
                      dealer.status === 'Called' ? 'border-emerald-200 bg-emerald-50/30' :
                      dealer.status === 'Follow Up' ? 'border-amber-200 bg-amber-50/30' :
                      'border-red-200 bg-red-50/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="font-semibold">{dealer.name}</div>
                            <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${dealerStatusColors[dealer.status]}`}>{dealer.status}</span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">{dealer.distance} mi • <a href={`tel:${dealer.phone}`} className="text-emerald-600 hover:underline" onClick={e => e.stopPropagation()}>{dealer.phone}</a></div>
                          {dealer.lastCalled && (
                            <div className="text-xs text-slate-500 mt-1.5">
                              <span className="font-medium">Last:</span> {dealer.lastCalled}
                              {dealer.contactName && <span> · {dealer.contactName}</span>}
                              {dealer.lastOutcome && <span> · {dealer.lastOutcome}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <button onClick={() => { setOfferDealership(dealer.name); setShowOfferModal(true); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-2xl hover:border-emerald-300 hover:text-emerald-600 transition">+ Offer</button>
                          <button onClick={() => openCallModal(dealer)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-2xl hover:bg-emerald-700 transition">Log Call</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offer Tracker + Comparison */}
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Offer Comparison <span className="text-slate-400 font-normal text-base">({offers.length})</span></h2>
                <button onClick={() => setShowOfferModal(true)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-2xl hover:bg-emerald-700 transition">+ Log Offer</button>
              </div>
              {offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.filter(o => o.status !== 'Rejected').length >= 2 && (
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Side-by-Side Comparison</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Metric</th>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => (
                                <th key={offer.id} className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wide ${offer.status === 'Best' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  <div>{offer.dealershipName}</div>
                                  {offer.status === 'Best' && <div className="text-xs font-normal text-emerald-500 normal-case mt-0.5">⭐ Best Pick</div>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500 font-medium">Price (OTD)</td>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => {
                                const allPrices = offers.filter(o => o.status !== 'Rejected').map(o => parsePrice(o.price)).filter(Boolean);
                                const thisPrice = parsePrice(offer.price);
                                const isLowest = allPrices.length > 0 && thisPrice === Math.min(...allPrices);
                                return (
                                  <td key={offer.id} className={`py-3 px-4 text-center font-bold text-lg ${isLowest ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {offer.price}
                                    {isLowest && <div className="text-xs font-normal text-emerald-500">Lowest</div>}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500 font-medium">MSRP</td>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => (
                                <td key={offer.id} className="py-3 px-4 text-center text-slate-400 line-through">{offer.msrp || '—'}</td>
                              ))}
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500 font-medium">Savings</td>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => {
                                const allDiscounts = offers.filter(o => o.status !== 'Rejected').map(o => { const m = parsePrice(o.msrp); const p = parsePrice(o.price); return m && p ? m - p : 0; });
                                const msrpNum = parsePrice(offer.msrp); const priceNum = parsePrice(offer.price);
                                const discount = msrpNum && priceNum ? msrpNum - priceNum : 0;
                                const isBestSavings = discount > 0 && discount === Math.max(...allDiscounts);
                                return (
                                  <td key={offer.id} className={`py-3 px-4 text-center font-semibold ${discount > 0 ? isBestSavings ? 'text-emerald-600' : 'text-slate-700' : 'text-slate-400'}`}>
                                    {discount > 0 ? formatPrice(discount) : '—'}
                                    {isBestSavings && discount > 0 && <div className="text-xs font-normal text-emerald-500">Most savings</div>}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500 font-medium">Notes</td>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => (
                                <td key={offer.id} className="py-3 px-4 text-center text-xs text-slate-500">{offer.notes || '—'}</td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-3 px-4 text-slate-500 font-medium">Action</td>
                              {offers.filter(o => o.status !== 'Rejected').map(offer => (
                                <td key={offer.id} className="py-3 px-4 text-center">
                                  <button onClick={() => setBestOffer(offer.id)} className={`px-3 py-1.5 text-xs rounded-xl border transition ${offer.status === 'Best' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}>
                                    {offer.status === 'Best' ? '⭐ Best Pick' : 'Set as Best'}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-slate-100 mt-4 pt-4" />
                    </div>
                  )}

                  {offers.map(offer => (
                    <div key={offer.id} className={`border rounded-2xl p-5 ${
                      offer.status === 'Best' ? 'border-emerald-300 bg-emerald-50/40' :
                      offer.status === 'Rejected' ? 'border-red-200 bg-red-50/20 opacity-50' : 'border-slate-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold">{offer.dealershipName}</div>
                            {offer.status === 'Best' && <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">⭐ Best</span>}
                            {offer.status === 'Rejected' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Rejected</span>}
                          </div>
                          <div className="mt-1">
                            <span className="text-2xl font-bold text-slate-800">{offer.price}</span>
                            {offer.msrp && <span className="text-sm text-slate-400 ml-2 line-through">{offer.msrp} MSRP</span>}
                            {offer.discount && <span className="text-sm text-emerald-600 ml-2 font-medium">{offer.discount}</span>}
                          </div>
                          {offer.notes && <div className="text-sm text-slate-500 mt-1">{offer.notes}</div>}
                          <div className="text-xs text-slate-400 mt-1">{offer.timestamp}</div>
                        </div>
                        {offer.status !== 'Rejected' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => setBestOffer(offer.id)} className={`px-3 py-1.5 text-xs rounded-xl border transition ${offer.status === 'Best' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}>
                              {offer.status === 'Best' ? '⭐ Best' : 'Set Best'}
                            </button>
                            <button onClick={() => rejectOffer(offer.id)} className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 transition">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="text-sm">No offers logged yet. Click "+ Offer" on a dealership or above to add one.</p>
                </div>
              )}
            </div>

            {/* Call Log */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6">Call Log <span className="text-slate-400 font-normal text-base">({callLogs.length})</span></h2>
              {callLogs.length > 0 ? (
                <div className="space-y-4">
                  {callLogs.map(log => (
                    <div key={log.id} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="mt-1 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${log.rating >= 4 ? 'bg-emerald-100 text-emerald-700' : log.rating >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                          {log.rating}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-semibold text-sm">{log.dealershipName}</div>
                          <div className="text-xs text-slate-400 shrink-0">{log.timestamp}</div>
                        </div>
                        {log.contactName && <div className="text-xs text-slate-500 mt-0.5">Contact: {log.contactName}</div>}
                        <div className="text-xs font-medium text-emerald-700 mt-1">{log.outcome}</div>
                        {log.notes && <div className="text-sm text-slate-600 mt-1.5 bg-slate-50 rounded-xl p-3">{log.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">📞</div>
                  <p className="text-sm">No calls logged yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-5">File Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Deal ID</span><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{dealId}</span></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`text-xs px-3 py-1 rounded-full font-medium border ${STATUS_COLORS[dealStatus]}`}>{dealStatus} ▾</button>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Inventory</span><span className="font-semibold">{inventory.length} listings</span></div>
                {dealerships.length > 0 && <div className="flex justify-between"><span className="text-slate-500">Dealerships</span><span className="font-semibold">{dealerships.length} in range</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Contacted</span><span className="font-semibold">{calledCount} of {dealerships.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Active Leads</span><span className="font-semibold text-amber-600">{activeCount}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Offers</span><span className="font-semibold text-emerald-600">{offers.length}</span></div>
                <div className="border-t border-slate-100 pt-4 flex justify-between"><span className="text-slate-500">Time on File</span><span className="font-semibold">{formatTime(totalTime)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Calls Logged</span><span className="font-semibold">{callLogs.length}</span></div>
              </div>
            </div>

            {dealerships.length > 0 && (
              <div className="bg-white rounded-3xl shadow p-8">
                <h3 className="font-semibold mb-4">Outreach Progress</h3>
                <div className="space-y-3">
                  {dealerships.map(d => (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        d.status === 'Called' ? 'bg-emerald-500' : d.status === 'Follow Up' ? 'bg-amber-400' :
                        d.status === 'No Inventory' ? 'bg-red-400' : 'bg-slate-200'
                      }`} />
                      <div className="text-sm truncate flex-1">{d.name}</div>
                      <div className="text-xs text-slate-400 shrink-0">{d.distance}mi</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${dealerships.length > 0 ? (calledCount / dealerships.length) * 100 : 0}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-2 text-right">{calledCount}/{dealerships.length} contacted</div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                {vehiclePref && (
                  <button onClick={triggerInventorySearch} disabled={inventorySearching} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                    {inventorySearching ? '🔄 Searching...' : '🔍 Refresh Inventory'}
                  </button>
                )}
                <button onClick={() => setShowOfferModal(true)} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">💰 Log New Offer</button>
                <button onClick={copyDealSummary} className={`w-full text-left px-4 py-3 rounded-2xl border transition text-sm font-medium ${copied ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                  {copied ? '✓ Copied!' : '📋 Copy Deal Summary'}
                </button>
                <button onClick={openEmailModal} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">📧 Send Client Update</button>
                <button onClick={() => setShowCompleteModal(true)} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">🏁 Mark Deal Complete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      {selectedDealership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Log Call</h3>
              <p className="text-slate-500 mt-1">{selectedDealership.name} · <a href={`tel:${selectedDealership.phone}`} className="text-emerald-600 hover:underline">{selectedDealership.phone}</a></p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Mike from internet sales" className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Outcome</label>
                <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                  {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 h-28 resize-none text-sm focus:outline-none focus:border-emerald-500" placeholder="Price quoted, VIN, availability date, next steps..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dealer Rating <span className="text-slate-400 font-normal">— {RATING_LABELS[callRating]}</span></label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setCallRating(r)} className={`flex-1 py-2.5 rounded-2xl border text-sm font-semibold transition ${callRating === r ? r >= 4 ? 'bg-emerald-600 text-white border-emerald-600' : r === 3 ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500' : 'border-slate-200 hover:bg-slate-50'}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setSelectedDealership(null)} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
              <button onClick={logCall} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 text-sm font-medium">Save Call Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Log Offer</h3>
              <p className="text-slate-500 mt-1">Record a price quote from a dealership</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dealership</label>
                <select value={offerDealership} onChange={e => setOfferDealership(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                  <option value="">Select dealership</option>
                  {dealerships.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quoted Price (OTD)</label>
                  <input type="text" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="$58,500" className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">MSRP <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="text" value={offerMsrp} onChange={e => setOfferMsrp(e.target.value)} placeholder="$62,000" className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea value={offerNotes} onChange={e => setOfferNotes(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 h-24 resize-none text-sm focus:outline-none focus:border-emerald-500" placeholder="VIN, color, availability, conditions, expiry..." />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowOfferModal(false)} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
              <button onClick={logOffer} disabled={!offerDealership || !offerPrice} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-medium">Save Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏁</div>
              <h3 className="text-2xl font-bold">Mark Deal Complete</h3>
              <p className="text-slate-500 mt-1 text-sm">Confirm the final outcome for {dealInfo.clientName}</p>
            </div>
            {bestOffer && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Winning Offer</div>
                <div className="font-semibold text-slate-800">{bestOffer.dealershipName}</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{bestOffer.price}</div>
                {bestOffer.discount && <div className="text-sm text-emerald-600">{bestOffer.discount}</div>}
              </div>
            )}
            {!bestOffer && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
                No best offer selected yet. You can still mark the deal complete — add savings details below.
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Savings Achieved <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={completeSavings} onChange={e => setCompleteSavings(e.target.value)} placeholder="e.g. $3,850 below MSRP" className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Closing Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 h-24 resize-none text-sm focus:outline-none focus:border-emerald-500" placeholder="Final deal notes, delivery date, client feedback..." />
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 mt-5 text-sm text-slate-500">
              Marking complete will:
              <ul className="mt-2 space-y-1">
                <li>✓ Set deal status to Complete</li>
                <li>✓ Update the client dashboard with the final result</li>
                <li>✓ Stop the work timer</li>
              </ul>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
              <button onClick={handleComplete} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 text-sm font-semibold">Confirm Complete 🏁</button>
            </div>
          </div>
        </div>
      )}
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            {emailSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✉️</div>
                <h3 className="text-2xl font-bold text-emerald-600 mb-2">Sent!</h3>
                <p className="text-slate-500 text-sm">The client update email has been delivered.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold">Send Client Update</h3>
                  <p className="text-slate-500 mt-1 text-sm">Send an email update to {dealInfo.clientName}</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea
                      value={emailMessage}
                      onChange={e => setEmailMessage(e.target.value)}
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 h-36 resize-none text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Write your update message..."
                    />
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-500">
                    The email will include the current deal status ({dealStatus}) and your name as the advocate.
                  </div>
                  {emailError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{emailError}</div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowEmailModal(false)} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
                  <button
                    onClick={sendEmail}
                    disabled={emailSending || !emailMessage.trim()}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    {emailSending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
