import {
  Projector,
  Wind,
  Monitor,
  Mic,
  Tv,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

export const ResourcesIconsList: Record<string, { label: string; icon: LucideIcon }> = {
  Projector: { label: 'Projetor', icon: Projector },
  Wind: { label: 'Ar-condicionado', icon: Wind },
  Monitor: { label: 'Monitor', icon: Monitor },
  Mic: { label: 'Microfone', icon: Mic },
  Tv: { label: 'TV', icon: Tv },
  Wifi: { label: 'Wi-Fi', icon: Wifi },
}
