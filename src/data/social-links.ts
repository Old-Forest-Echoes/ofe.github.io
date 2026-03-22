export interface SocialLink {
  href: string;
  label: string;
  icon: string;
  width: number;
  height: number;
  className?: string;
}

export const socialLinks: SocialLink[] = [
  {
    href: "https://www.facebook.com/oldforestechoes",
    label: "Old Forest Echoes on Facebook",
    icon: "/icons/facebook.svg",
    width: 23,
    height: 23,
  },
  {
    href: "https://www.instagram.com/oldforestechoes",
    label: "Old Forest Echoes on Instagram",
    icon: "/icons/instagram.svg",
    width: 23,
    height: 23,
  },
  {
    href: "https://www.youtube.com/channel/UCXpK5IHy4k0DY2e6t7daA1g",
    label: "Old Forest Echoes on YouTube",
    icon: "/icons/youtube.svg",
    width: 23,
    height: 23,
  },
  {
    // TODO: personal profile — consider creating a project-specific Linktree (used in Organization sameAs)
    href: "https://linktr.ee/Barboraxu",
    label: "Barbora Xu on Linktree",
    icon: "/icons/linktree.svg",
    width: 100,
    height: 20,
    className: "linktree-logo",
  },
];
