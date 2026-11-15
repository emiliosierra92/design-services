// Actual owner-supplied photos only. Add a local image path, alt text, caption,
// and dimensions here after the owner supplies each photo. No stock stand-ins.
export type LuckyPhoto = { src: string; alt: string; caption: string; width: number; height: number };
export const luckyPhotos: LuckyPhoto[] = [
  { src: '/images/luckybird/luckybird.png', alt: 'Lucky, a grey and white whiteface cockatiel, facing the camera with his crest raised.', caption: 'Meet Lucky, our feathered mascot.', width: 1024, height: 1536 },
];
// New notes appear on the page without editing the layout. No invented updates.
export const luckyUpdates: { title: string; text: string; date?: string }[] = [];

export { luckyProduct } from './luckybird-product.mjs';

export const luckyCareResources = [
  { title: 'Everyday care, thoughtfully', text: 'A suitable diet, a clean living space, appropriate perches, and enrichment all matter. An avian veterinarian can help you make a care plan for your own bird.', href: 'https://www.merckvetmanual.com/exotic-and-laboratory-animals/pet-birds/overview-of-pet-birds', source: 'Merck Veterinary Manual' },
  { title: 'Room to be a bird', text: 'Pet birds need opportunities for natural movement, activity, and social interaction. Think beyond a cage: make space for supervised play, foraging, and time together.', href: 'https://www.merckvetmanual.com/exotic-and-laboratory-animals/pet-birds/overview-of-pet-birds', source: 'Merck Veterinary Manual' },
  { title: 'Small lungs, careful surroundings', text: 'Household fumes and some everyday products can harm birds. Learn about bird-safe surroundings and ask an avian veterinarian when you are unsure.', href: 'https://www.merckvetmanual.com/bird-owners/routine-care-and-safety-of-birds/household-hazards-for-pet-birds', source: 'Merck Veterinary Manual' },
];
