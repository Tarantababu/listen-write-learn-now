import type { Icon } from 'lucide-react';

import { Icons } from '@/components/icons';

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
};

export type DocsConfig = {
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
};

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavLink[];
    }
);

export type NavLink = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
};

export type MainNavItem = NavItem;

export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export interface Option {
  label: string;
  value: string;
  icon?: Icon;
}

export type SettingsConfig = {
  name: string;
  description: string;
  motto: string;
  features: {
    darkMode: boolean;
    pushNotifications: boolean;
    aiAssistance: boolean;
  };
};

export type Language = 
  | 'german' 
  | 'french' 
  | 'spanish' 
  | 'italian' 
  | 'portuguese' 
  | 'english' 
  | 'dutch' 
  | 'swedish' 
  | 'norwegian'
  | 'turkish'
  | 'russian'
  | 'polish'
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'hindi';
