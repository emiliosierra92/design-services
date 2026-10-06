import type { Metadata } from 'next';
import Home from './home';

const socialTitle = 'Emilio Sierra — Creative Technology Studio';
const socialDescription = 'I use design and technology to turn ideas and everyday problems into useful experiences. Explore my work in web development, graphic design and video production.';
const socialImage = {
  url: 'https://emiliosierra.com/images/emilio-sierra-social.png',
  width: 1734,
  height: 907,
  alt: 'Emilio Sierra — Creative Technology Studio in Miami',
};

export const metadata: Metadata = {
  // Bypass the inherited title template to preserve the exact homepage title.
  title: { absolute: 'Emilio Sierra | Creative Technology Studio in Miami' },
  description: 'Emilio Sierra is a Miami-based creative technologist designing and building websites, applications, graphic design and video experiences. Explore my work and start a project.',
  // Keep the homepage canonical and social URL scoped to this route.
  alternates: { canonical: 'https://emiliosierra.com' },
  openGraph: {
    title: socialTitle,
    description: socialDescription,
    url: 'https://emiliosierra.com',
    siteName: 'Emilio Sierra',
    type: 'website',
    images: [{ ...socialImage, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: socialTitle,
    description: socialDescription,
    images: [socialImage],
  },
};

export default function Page() {
  return <Home />;
}
