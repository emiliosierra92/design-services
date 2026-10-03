import { Text } from '@/components/language-provider';
import Link from 'next/link';
export default function NotFound() { return <main id="main" className="page-shell not-found"><p className="eyebrow"><Text text="A different direction" /></p><h1><Text text="Nothing here." /><br /><Text text="Plenty ahead." /></h1><Link className="text-link" href="/"><Text text="Return to the studio →" /></Link></main>; }
