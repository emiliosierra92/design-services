import diyBlues from '../../public/images/diyblues.png';
import liveSportsBroadcasting from '../../public/images/live-sports-broadcasting.png';

// Provisional owner-supplied copy. Resolve docs/master-specification.txt before launch.
export const services = [
  { number: '01', discipline: 'Digital', title: 'Web + App Design & Development', description: 'I design and build websites, applications and digital tools around the people who use them.', capabilities: 'Websites / Web apps / UI + UX / Digital tools' },
  { number: '02', discipline: 'Visual', title: 'Graphic Design', description: 'Visual design created for digital experiences, communication and physical production.', capabilities: 'Digital graphics / Production artwork / Visual design' },
  { number: '03', discipline: 'Motion', title: 'Video Production', description: 'Video capture, live streaming and production backed by hands-on live broadcasting experience.', capabilities: 'Video / Live streaming / Production / Editing' },
];
export const projects = [
  { slug: 'theatrical-prop-packaging', number: '01', title: 'From pixels to physical.', name: 'Theatrical prop packaging', discipline: 'Graphic design / Production artwork', summary: 'Recreating vintage packaging for a life on stage.', media: 'Artwork & finished prop photographs pending', image: { src: diyBlues, alt: 'Gauloises Blondes replica cigarette carton guide showing flat artwork, assembly steps and views of the finished blue package.' }, sections: [
    { title: 'A small object. Every detail matters.', text: 'I recreated a vintage cigarette-box graphic in Adobe Photoshop for a designer to use in a theatrical prop. The artwork needed to work as a package, with components arranged to wrap around a physical form.' },
    { title: 'Reference to production artwork.', text: 'The process brought together rulers, measurement, graphic reconstruction and layout techniques. I worked on the graphic recreation and production artwork; the designer used it to produce the physical prop.' },
    { title: 'From digital to physical.', text: 'The reference, artwork and finished prop will be shown here once the media and publication permissions are confirmed.' },
  ] },
  { slug: 'live-sports-broadcasting', number: '02', title: 'Made for the moment.', name: 'South Florida live sports broadcasting', discipline: 'Video production / Live broadcasting', summary: 'Behind the scenes of live high-school baseball in South Florida.', media: 'Broadcast & behind-the-scenes media', image: { src: liveSportsBroadcasting, alt: 'Behind the live broadcast: South Florida high-school baseball production collage showing channel branding, scoreboard graphics, live switching, scorekeeping and camera equipment.' }, sections: [
    { title: 'Before the first pitch.', text: 'Working with a small broadcast crew across Miami-Dade and Broward County, I helped set up the production site, prepare equipment and check that systems were ready to go live.' },
    { title: 'An experience unfolding in real time.', text: 'During broadcasts, I switched camera feeds, monitored audio and the YouTube live feed, followed channel activity and interacted with viewers. After the game, I helped break down the production site and equipment.' },
    { title: 'Creating in the live environment.', text: 'This work taught me to operate experiences that had to function in real time. Broadcast excerpts and production photographs will be added once the media and permissions are confirmed.' },
  ] },
];
