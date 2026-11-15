import { luckyStory } from './lucky-story';

const originals = [luckyStory.title, luckyStory.summary, ...luckyStory.introduction,
  ...luckyStory.sections.flatMap(section => [section.title, ...section.paragraphs])];
const translations = [
  'El Fondo de Plumas de Lucky Bird: una pequeña idea con un propósito mayor',
  'Un proyecto personal que conecta la historia de Lucky, el diseño web, la comunidad y una primera prueba de tienda.',
  'EmilioSierra.com es un lugar para convertir ideas en experiencias digitales útiles. El Fondo de Plumas de Lucky Bird hace realidad ese objetivo a través de algo personal: mi cacatúa ninfa de cara blanca, Lucky, y las plumas que muda de forma natural.',
  'La idea es sencilla. En lugar de dejar que esas plumas se desperdicien, las ofrezco como selecciones sorpresa que ayudan a financiar su alimentación nutritiva y sus cuidados. Crear un hogar para este proyecto también me permite demostrar cómo un sitio web puede conectar historias, comunidad y ventas en línea.',
  'Cómo funciona la página',
  'La página dedicada en emiliosierra.com/luckybird, accesible desde la página de inicio a través de Lucky Bird’s Feather fund, está diseñada para presentar a Lucky mediante fotos, historias y novedades. También ofrecerá un espacio para compartir información sobre las aves y su cuidado responsable.',
  'Su primer producto es Lucky Bird’s Feather Surprise, con un precio de $10. Los compradores reciben una pluma o un conjunto de plumas mudadas de forma natural y seleccionadas al azar. Podrían recibir una pluma larga de la cola, una pluma mediana con algo de plumón o una colección de plumas pequeñas con una pluma de la cresta.',
  'La sorpresa forma parte de la experiencia, pero las expectativas claras importan. No se garantizan tamaños, tipos, cantidades ni combinaciones de plumas, y la disponibilidad depende de lo que Lucky mude de forma natural. Cada compra apoya sus cuidados.',
  'Una sección de comunidad prevista permitirá a los compradores compartir fotos e historias de sus selecciones. Incluso una queja en broma por recibir una pluma diminuta será bienvenida. El objetivo es dar a las personas un motivo para participar, sonreír y conectar con la historia de Lucky.',
  'Una primera prueba práctica de tienda',
  'Este proyecto también sirve como primera prueba de tienda para EmilioSierra.com. Empezar con un solo producto ofrece una oportunidad manejable para evaluar la integración con Stripe antes de ampliar el catálogo.',
  'El proceso de desarrollo incluye probar el pago, la recopilación de información de envío, los impuestos sobre ventas aplicables, la confirmación del pago y los pagos cancelados o fallidos en el entorno de pruebas de Stripe antes de aceptar pagos reales.',
  'Ese trabajo importa más allá de este producto. Ayuda a establecer una base para futuros proyectos que necesiten una forma fiable de pasar de una idea a una compra en línea.',
  'Cómo se conecta con mi objetivo mayor',
  'El Fondo de Plumas de Lucky Bird refleja el tipo de trabajo que quiero que represente EmilioSierra.com: ideas personales convertidas en sitios web funcionales y bien pensados.',
  'Un proyecto no necesita un gran inventario ni un plan de negocio complicado para merecer un buen hogar en línea. A veces empieza con una mascota, una afición creativa, una pequeña colección o una causa que le importa a alguien. El reto es reunir la historia, el diseño, la tecnología y la experiencia del cliente de una manera que tenga sentido.',
  'La página de Lucky es una oportunidad para mostrar ese proceso a través de mi propio proyecto, documentando lo que funciona y mejorándolo a medida que crece.',
  'Una invitación a crear algo propio',
  'Espero que alguien vea la página de Lucky y piense: «Yo tengo una idea así».',
  'Tu versión podría apoyar el cuidado de un animal, mostrar productos hechos a mano, financiar un esfuerzo comunitario o convertir un experimento creativo en una pequeña tienda. No tiene que parecerse a la mía. Debe reflejar tu historia y lo que quieres lograr.',
  'Si tienes una idea y necesitas ayuda para llevarla a internet, contáctame a través de EmilioSierra.com. Me encantaría ayudarte a darle forma en un sitio web que ofrezca a las personas una manera clara de conocer, participar y apoyar lo que estás creando.',
];

if (originals.length !== translations.length) throw new Error('Blog translation count does not match.');
export const blogSpanish: Record<string, string> = Object.fromEntries(originals.map((text, index) => [text, translations[index]]));
Object.assign(blogSpanish, {
  'contact me through EmilioSierra.com': 'contáctame a través de EmilioSierra.com',
});
