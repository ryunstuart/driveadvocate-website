import ClientDealFile from './ClientDealFile';

export async function generateStaticParams() {
  return [{ dealId: 'placeholder' }];
}

export default function DealFilePage() {
  return <ClientDealFile />;
}