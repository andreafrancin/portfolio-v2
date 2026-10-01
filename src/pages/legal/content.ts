import { CONTACT_EMAIL, LEGAL_NAME, SITE_DOMAIN } from '../../config/site';

export type Block = string | { list: string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface LegalCopy {
  title: string;
  updatedLabel: string;
  intro: string;
  contents: string;
  sections: LegalSection[];
}

const es: LegalCopy = {
  title: 'Aviso legal y privacidad',
  updatedLabel: 'Última actualización',
  intro: `Este sitio web, ${SITE_DOMAIN}, es el portfolio profesional de la ilustradora y diseñadora gráfica ${LEGAL_NAME}. Aquí se explica quién está detrás, cómo se protege su obra y qué se hace con los datos personales.`,
  contents: 'Contenido',
  sections: [
    {
      id: 'titular',
      title: 'Titular del sitio web',
      blocks: [
        'En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI):',
        {
          list: [
            `Titular: ${LEGAL_NAME}`,
            `Correo electrónico: ${CONTACT_EMAIL}`,
            'Actividad: ilustración y diseño gráfico',
          ],
        },
      ],
    },
    {
      id: 'propiedad-intelectual',
      title: 'Propiedad intelectual',
      blocks: [
        `Todas las ilustraciones, dibujos, diseños, logotipos, rotulaciones, composiciones, textos y fotografías que se muestran en este sitio web son obras originales de ${LEGAL_NAME} y están protegidas por el Texto Refundido de la Ley de Propiedad Intelectual (Real Decreto Legislativo 1/1996) y por los tratados internacionales, entre ellos el Convenio de Berna. La autora conserva todos los derechos morales y de explotación sobre su obra.`,
        'Los trabajos realizados para clientes se muestran como portfolio. Las marcas, logotipos y nombres comerciales de esos clientes pertenecen a sus respectivos titulares.',
        'Queda prohibido, sin autorización previa y por escrito de la autora:',
        {
          list: [
            'Reproducir, copiar o descargar las obras para usarlas, en todo o en parte, por cualquier medio o formato.',
            'Distribuirlas, publicarlas, venderlas o comunicarlas públicamente, incluidas redes sociales, webs, publicaciones impresas y tiendas en línea.',
            'Modificarlas, adaptarlas, colorearlas, calcarlas o crear obras derivadas o imitaciones a partir de ellas.',
            'Usarlas en productos, merchandising, estampados, tatuajes, NFT o cualquier uso comercial.',
            'Eliminar o alterar la firma, las marcas de agua o los datos de autoría.',
          ],
        },
        'Se permite ver las obras para uso personal y compartir enlaces a este sitio web. La cita con fines docentes o de investigación solo es posible en los límites del artículo 32 de la Ley de Propiedad Intelectual, indicando siempre la autoría y la fuente.',
      ],
    },
    {
      id: 'inteligencia-artificial',
      title: 'Inteligencia artificial y minería de datos',
      blocks: [
        'Al amparo del artículo 4.3 de la Directiva (UE) 2019/790 y del artículo 67.3 del Real Decreto-ley 24/2021, la autora se reserva expresamente el derecho a autorizar la minería de textos y datos sobre todo el contenido de este sitio web.',
        'En consecuencia, queda prohibido usar las obras, total o parcialmente, para entrenar, ajustar, alimentar o evaluar sistemas de inteligencia artificial, crear conjuntos de datos o generar imágenes «al estilo de» la autora, salvo licencia expresa y por escrito.',
        'Esta reserva también se expresa por medios de lectura mecánica: el archivo robots.txt bloquea los rastreadores de inteligencia artificial y el sitio declara la reserva según el protocolo TDMRep.',
      ],
    },
    {
      id: 'licencias',
      title: 'Licencias y encargos',
      blocks: [
        `Si quieres usar alguna obra o encargar un trabajo, escribe a ${CONTACT_EMAIL}. Las licencias se conceden por escrito e indican el uso, el medio, el territorio y la duración autorizados.`,
        'El uso no autorizado de las obras podrá dar lugar a las acciones civiles y penales que correspondan.',
      ],
    },
    {
      id: 'privacidad',
      title: 'Privacidad',
      blocks: [
        `Responsable del tratamiento: ${LEGAL_NAME}. Contacto: ${CONTACT_EMAIL}.`,
        'Navegación: este sitio web no tiene formularios, no usa herramientas de analítica ni publicidad y no instala cookies de seguimiento. Solo guarda en tu navegador tus preferencias (idioma y vista de los proyectos), que son técnicas y necesarias para el funcionamiento del sitio y están exentas de consentimiento (artículo 22.2 de la LSSI). Por seguridad, el proveedor de alojamiento puede registrar datos técnicos como la dirección IP.',
        'Si escribes por correo electrónico, tus datos se usan para responderte y, si lo pides, preparar un presupuesto. La base legal es tu consentimiento y la aplicación de medidas precontractuales. Se conservan mientras dure la conversación o la relación profesional.',
        'Destinatarios: los datos no se ceden a terceros, salvo obligación legal. Los proveedores que alojan el sitio y el correo electrónico actúan como encargados del tratamiento con contrato. Si alguno está fuera del Espacio Económico Europeo, la transferencia se hace con las garantías que prevé el RGPD.',
        `Derechos: puedes pedir el acceso, la rectificación, la supresión, la oposición, la limitación del tratamiento y la portabilidad de tus datos escribiendo a ${CONTACT_EMAIL}. Si consideras que no se han respetado, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).`,
      ],
    },
    {
      id: 'enlaces',
      title: 'Enlaces externos',
      blocks: [
        'Este sitio enlaza a perfiles en Instagram y LinkedIn, que tienen sus propias condiciones y políticas de privacidad.',
        'Este aviso se rige por la legislación española.',
      ],
    },
  ],
};

const ca: LegalCopy = {
  title: 'Avís legal i privacitat',
  updatedLabel: 'Darrera actualització',
  intro: `Aquest lloc web, ${SITE_DOMAIN}, és el portfoli professional de la il·lustradora i dissenyadora gràfica ${LEGAL_NAME}. Aquí s’explica qui hi ha al darrere, com es protegeix la seva obra i què es fa amb les dades personals.`,
  contents: 'Contingut',
  sections: [
    {
      id: 'titular',
      title: 'Titular del lloc web',
      blocks: [
        'En compliment de la Llei 34/2002, de serveis de la societat de la informació i de comerç electrònic (LSSI):',
        {
          list: [
            `Titular: ${LEGAL_NAME}`,
            `Correu electrònic: ${CONTACT_EMAIL}`,
            'Activitat: il·lustració i disseny gràfic',
          ],
        },
      ],
    },
    {
      id: 'propietat-intellectual',
      title: 'Propietat intel·lectual',
      blocks: [
        `Totes les il·lustracions, dibuixos, dissenys, logotips, retolacions, composicions, textos i fotografies que es mostren en aquest lloc web són obres originals de ${LEGAL_NAME} i estan protegides pel Text refós de la Llei de propietat intel·lectual (Reial decret legislatiu 1/1996) i pels tractats internacionals, entre ells el Conveni de Berna. L’autora conserva tots els drets morals i d’explotació sobre la seva obra.`,
        'Els treballs fets per a clients es mostren com a portfoli. Les marques, logotips i noms comercials d’aquests clients pertanyen als seus respectius titulars.',
        'Queda prohibit, sense autorització prèvia i per escrit de l’autora:',
        {
          list: [
            'Reproduir, copiar o descarregar les obres per fer-les servir, totalment o parcialment, per qualsevol mitjà o format.',
            'Distribuir-les, publicar-les, vendre-les o comunicar-les públicament, incloses xarxes socials, webs, publicacions impreses i botigues en línia.',
            'Modificar-les, adaptar-les, acolorir-les, calcar-les o crear obres derivades o imitacions a partir d’elles.',
            'Fer-les servir en productes, marxandatge, estampats, tatuatges, NFT o qualsevol ús comercial.',
            'Eliminar o alterar la signatura, les marques d’aigua o les dades d’autoria.',
          ],
        },
        'Es permet veure les obres per a ús personal i compartir enllaços a aquest lloc web. La cita amb finalitats docents o de recerca només és possible dins els límits de l’article 32 de la Llei de propietat intel·lectual, indicant sempre l’autoria i la font.',
      ],
    },
    {
      id: 'intelligencia-artificial',
      title: 'Intel·ligència artificial i mineria de dades',
      blocks: [
        'A l’empara de l’article 4.3 de la Directiva (UE) 2019/790 i de l’article 67.3 del Reial decret llei 24/2021, l’autora es reserva expressament el dret a autoritzar la mineria de textos i dades sobre tot el contingut d’aquest lloc web.',
        'En conseqüència, queda prohibit fer servir les obres, totalment o parcialment, per entrenar, ajustar, alimentar o avaluar sistemes d’intel·ligència artificial, crear conjunts de dades o generar imatges «a l’estil de» l’autora, llevat de llicència expressa i per escrit.',
        'Aquesta reserva també s’expressa per mitjans de lectura mecànica: el fitxer robots.txt bloqueja els rastrejadors d’intel·ligència artificial i el lloc declara la reserva segons el protocol TDMRep.',
      ],
    },
    {
      id: 'llicencies',
      title: 'Llicències i encàrrecs',
      blocks: [
        `Si vols fer servir alguna obra o encarregar un treball, escriu a ${CONTACT_EMAIL}. Les llicències es concedeixen per escrit i indiquen l’ús, el mitjà, el territori i la durada autoritzats.`,
        'L’ús no autoritzat de les obres podrà donar lloc a les accions civils i penals que corresponguin.',
      ],
    },
    {
      id: 'privacitat',
      title: 'Privacitat',
      blocks: [
        `Responsable del tractament: ${LEGAL_NAME}. Contacte: ${CONTACT_EMAIL}.`,
        'Navegació: aquest lloc web no té formularis, no fa servir eines d’analítica ni publicitat i no instal·la galetes de seguiment. Només desa al teu navegador les teves preferències (idioma i vista dels projectes), que són tècniques i necessàries per al funcionament del lloc i estan exemptes de consentiment (article 22.2 de la LSSI). Per seguretat, el proveïdor d’allotjament pot registrar dades tècniques com l’adreça IP.',
        'Si escrius per correu electrònic, les teves dades es fan servir per respondre’t i, si ho demanes, preparar un pressupost. La base legal és el teu consentiment i l’aplicació de mesures precontractuals. Es conserven mentre duri la conversa o la relació professional.',
        'Destinataris: les dades no es cedeixen a tercers, llevat d’obligació legal. Els proveïdors que allotgen el lloc i el correu electrònic actuen com a encarregats del tractament amb contracte. Si algun és fora de l’Espai Econòmic Europeu, la transferència es fa amb les garanties que preveu el RGPD.',
        `Drets: pots demanar l’accés, la rectificació, la supressió, l’oposició, la limitació del tractament i la portabilitat de les teves dades escrivint a ${CONTACT_EMAIL}. Si consideres que no s’han respectat, pots reclamar davant l’Agència Espanyola de Protecció de Dades (www.aepd.es).`,
      ],
    },
    {
      id: 'enllacos',
      title: 'Enllaços externs',
      blocks: [
        'Aquest lloc enllaça a perfils a Instagram i LinkedIn, que tenen les seves pròpies condicions i polítiques de privacitat.',
        'Aquest avís es regeix per la legislació espanyola.',
      ],
    },
  ],
};

const en: LegalCopy = {
  title: 'Legal notice and privacy',
  updatedLabel: 'Last updated',
  intro: `This website, ${SITE_DOMAIN}, is the professional portfolio of illustrator and graphic designer ${LEGAL_NAME}. It explains who is behind it, how her work is protected and what is done with personal data.`,
  contents: 'Contents',
  sections: [
    {
      id: 'owner',
      title: 'Website owner',
      blocks: [
        'In accordance with Spanish Law 34/2002 on information society services and electronic commerce (LSSI):',
        {
          list: [
            `Owner: ${LEGAL_NAME}`,
            `Email: ${CONTACT_EMAIL}`,
            'Activity: illustration and graphic design',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual property',
      blocks: [
        `All illustrations, drawings, designs, logos, lettering, compositions, texts and photographs shown on this website are original works by ${LEGAL_NAME} and are protected by the Spanish Intellectual Property Law (Royal Legislative Decree 1/1996) and by international treaties, including the Berne Convention. The author retains all moral and economic rights in her work.`,
        'Work made for clients is shown as portfolio. The trademarks, logos and trade names of those clients belong to their respective owners.',
        'Without the author’s prior written permission, it is forbidden to:',
        {
          list: [
            'Reproduce, copy or download the works in order to use them, in whole or in part, by any means or in any format.',
            'Distribute, publish, sell or communicate them to the public, including on social media, websites, printed publications and online shops.',
            'Modify, adapt, colour, trace or create derivative works or imitations from them.',
            'Use them on products, merchandise, prints, tattoos, NFTs or for any commercial purpose.',
            'Remove or alter the signature, watermarks or authorship information.',
          ],
        },
        'You may view the works for personal use and share links to this website. Quotation for teaching or research is only allowed within the limits of article 32 of the Spanish Intellectual Property Law, always naming the author and the source.',
      ],
    },
    {
      id: 'artificial-intelligence',
      title: 'Artificial intelligence and data mining',
      blocks: [
        'Under article 4(3) of Directive (EU) 2019/790 and article 67.3 of Spanish Royal Decree-law 24/2021, the author expressly reserves the right to authorise text and data mining of all the content of this website.',
        'Accordingly, using the works, in whole or in part, to train, fine-tune, feed or evaluate artificial intelligence systems, to build datasets or to generate images “in the style of” the author is forbidden without an express written licence.',
        'This reservation is also expressed in machine-readable form: the robots.txt file blocks artificial intelligence crawlers and the site declares the reservation following the TDMRep protocol.',
      ],
    },
    {
      id: 'licensing',
      title: 'Licensing and commissions',
      blocks: [
        `To use a work or commission a project, write to ${CONTACT_EMAIL}. Licences are granted in writing and state the authorised use, medium, territory and duration.`,
        'Unauthorised use of the works may lead to the corresponding civil and criminal actions.',
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      blocks: [
        `Data controller: ${LEGAL_NAME}. Contact: ${CONTACT_EMAIL}.`,
        'Browsing: this website has no forms, uses no analytics or advertising tools and sets no tracking cookies. It only stores your preferences (language and project view) in your browser; these are technical, necessary for the site to work and exempt from consent (article 22.2 LSSI). For security, the hosting provider may log technical data such as your IP address.',
        'If you write by email, your data is used to reply and, if you ask for one, to prepare a quote. The legal basis is your consent and pre-contractual measures. It is kept for as long as the conversation or the professional relationship lasts.',
        'Recipients: data is not shared with third parties except where required by law. The providers that host the site and the email act as data processors under contract. Where a provider is outside the European Economic Area, transfers are made with the safeguards required by the GDPR.',
        `Your rights: you can request access, rectification, erasure, objection, restriction of processing and portability of your data by writing to ${CONTACT_EMAIL}. If you believe your rights have not been respected, you can complain to the Spanish Data Protection Agency (www.aepd.es).`,
      ],
    },
    {
      id: 'links',
      title: 'External links',
      blocks: [
        'This site links to profiles on Instagram and LinkedIn, which have their own terms and privacy policies.',
        'This notice is governed by Spanish law.',
      ],
    },
  ],
};

export const LEGAL_COPY: Record<string, LegalCopy> = { es, ca, en };
