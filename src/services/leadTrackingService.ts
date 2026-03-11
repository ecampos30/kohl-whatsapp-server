import { LeadTracking, LeadEntryChannel } from '../types/kohl-system';

const STORAGE_KEY = 'kohl_lead_tracking';

export function buildTrackingFromUrl(search: string, referrer?: string): LeadTracking | null {
  const params = new URLSearchParams(search);

  const utmSource = params.get('utm_source') ?? undefined;
  const utmMedium = params.get('utm_medium') ?? undefined;
  const utmCampaign = params.get('utm_campaign') ?? undefined;
  const utmContent = params.get('utm_content') ?? undefined;
  const utmTerm = params.get('utm_term') ?? undefined;
  const originPage = params.get('page') ?? params.get('origin_page') ?? undefined;
  const originCourse = params.get('course') ?? params.get('curso') ?? undefined;
  const ctaClicked = params.get('cta') ?? undefined;
  const campaignId = params.get('campaign_id') ?? undefined;
  const campaignName = params.get('campaign_name') ?? undefined;
  const channelParam = params.get('channel') ?? params.get('canal') ?? undefined;

  const hasAnyParam =
    utmSource || utmMedium || utmCampaign || originPage || originCourse ||
    ctaClicked || campaignId || channelParam;

  if (!hasAnyParam && !referrer) return null;

  const entryChannel = resolveEntryChannel(channelParam, utmSource, utmMedium, referrer);

  return {
    entryChannel,
    originPage,
    originCourse,
    ctaClicked,
    campaignId,
    campaignName,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer: referrer || undefined,
    capturedAt: new Date().toISOString(),
  };
}

function resolveEntryChannel(
  channelParam?: string,
  utmSource?: string,
  utmMedium?: string,
  referrer?: string
): LeadEntryChannel {
  if (channelParam) {
    const normalized = channelParam.toLowerCase();
    const validChannels: LeadEntryChannel[] = [
      'whatsapp', 'website', 'landing_page', 'campaign', 'social', 'referral', 'offer', 'reactivation'
    ];
    if (validChannels.includes(normalized as LeadEntryChannel)) {
      return normalized as LeadEntryChannel;
    }
  }

  if (utmMedium) {
    if (utmMedium === 'email' || utmMedium === 'sms') return 'campaign';
    if (utmMedium === 'whatsapp') return 'whatsapp';
    if (utmMedium === 'social' || utmMedium === 'social-media') return 'social';
    if (utmMedium === 'cpc' || utmMedium === 'paidsocial') return 'campaign';
    if (utmMedium === 'referral') return 'referral';
  }

  if (utmSource) {
    if (utmSource === 'whatsapp') return 'whatsapp';
    if (['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'].includes(utmSource)) return 'social';
    if (utmSource === 'reativacao' || utmSource === 'reactivation') return 'reactivation';
  }

  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname;
      if (refHost.includes('instagram') || refHost.includes('facebook') ||
          refHost.includes('tiktok') || refHost.includes('twitter')) {
        return 'social';
      }
    } catch {
      // invalid referrer URL, ignore
    }
  }

  return 'website';
}

export function saveTrackingToSession(tracking: LeadTracking): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
  } catch {
    // sessionStorage unavailable
  }
}

export function getTrackingFromSession(): LeadTracking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadTracking;
  } catch {
    return null;
  }
}

export function clearTrackingFromSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function mergeTracking(
  existing: LeadTracking | undefined,
  incoming: LeadTracking | null
): LeadTracking | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ),
  };
}

export function trackingToSourceLabel(tracking?: LeadTracking): string {
  if (!tracking) return 'Direto';
  if (tracking.utmCampaign) return `Campanha: ${tracking.utmCampaign}`;
  if (tracking.originCourse) return `Curso: ${tracking.originCourse}`;
  if (tracking.originPage) return tracking.originPage;
  if (tracking.utmSource) return tracking.utmSource;
  return entryChannelLabel(tracking.entryChannel);
}

export function entryChannelLabel(channel?: LeadEntryChannel): string {
  const labels: Record<LeadEntryChannel, string> = {
    whatsapp: 'WhatsApp',
    website: 'Site',
    landing_page: 'Landing Page',
    campaign: 'Campanha',
    social: 'Redes Sociais',
    referral: 'Indicacao',
    offer: 'Oferta',
    reactivation: 'Reativacao',
  };
  return channel ? labels[channel] : 'Desconhecido';
}
