export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: '/', label: 'About' },
  { href: '/artists/', label: 'Artists' },
  { href: '/events/', label: 'Events' },
];
