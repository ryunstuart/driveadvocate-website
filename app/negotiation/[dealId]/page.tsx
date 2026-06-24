import ClientDealFile from './ClientDealFile';

export async function generateStaticParams() {
  return [
    { dealId: 'placeholder' },
    { dealId: 'deal-001' },
    { dealId: 'deal-002' },
    { dealId: 'deal-003' },
    { dealId: 'deal-004' },
  ];
}

export default function DealFilePage() {
  return <ClientDealFile />;
}