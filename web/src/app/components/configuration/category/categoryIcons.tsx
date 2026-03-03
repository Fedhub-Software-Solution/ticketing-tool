import {
  FolderOpen,
  Bug,
  Lightbulb,
  AlertCircle,
  Zap,
  User,
  CreditCard,
  Mail,
  Lock,
  Settings,
  Database,
  Globe,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export const iconOptions: { name: string; icon: LucideIcon }[] = [
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'Bug', icon: Bug },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Zap', icon: Zap },
  { name: 'User', icon: User },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Mail', icon: Mail },
  { name: 'Lock', icon: Lock },
  { name: 'Settings', icon: Settings },
  { name: 'Database', icon: Database },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
];

export function getCategoryIcon(iconName: string, className = 'w-5 h-5') {
  const option = iconOptions.find((o) => o.name === iconName) || iconOptions[0];
  const IconComponent = option.icon;
  return <IconComponent className={className} />;
}
