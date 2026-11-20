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
        'Navegación: este sitio web no usa publicidad, herramientas de terceros como Google Analytics ni cookies de seguimiento. Solo guarda en tu navegador tus preferencias (idioma y vista de los proyectos), que son técnicas y necesarias para el funcionamiento del sitio y están exentas de consentimiento (artículo 22.2 de la LSSI). Por seguridad, el proveedor de alojamiento puede registrar datos técnicos como la dirección IP.',
        'Estadísticas de visitas: la web cuenta sus visitas con un sistema propio, anónimo y sin cookies, para saber qué páginas y proyectos interesan y de dónde llegan las visitas.',
        {
          list: [
            'Qué se registra: la página visitada, la web desde la que llegas (si tu navegador la indica), el país de la conexión, el idioma elegido en la web, el tipo de dispositivo (ordenador, móvil o tableta), el tiempo que la página está a la vista, hasta dónde se lee y algunas acciones en la web, como abrir una imagen o empezar a escribir en el formulario.',
            'Cómo se evita identificarte: no se guarda nada en tu dispositivo. Para no contar dos veces a la misma persona, tu dirección IP y los datos de tu navegador se combinan con una clave secreta que cambia cada día y se transforman en un código; la dirección IP no se guarda y la clave se borra al día siguiente, así que nadie puede saber quién eres ni seguir tus visitas de un día a otro. El país se calcula en el servidor de la web a partir de esa misma dirección IP, con la base de datos «IP to Country Lite» de DB-IP.com (licencia CC BY 4.0), y la IP se descarta enseguida.',
            'Base legal: el interés legítimo en conocer, de forma agregada, cómo se usa la web y mejorarla (artículo 6.1.f del RGPD).',
            'Conservación: los registros se borran a los 13 meses.',
            'Destinatarios: nadie; los datos solo están en el servidor de la propia web y no se envían a ningún servicio externo de estadísticas.',
            `Oposición: si tu navegador envía la señal de «no rastrear» o Global Privacy Control, tus visitas no se cuentan. También puedes oponerte en cualquier momento escribiendo a ${CONTACT_EMAIL}.`,
          ],
        },
        'Formulario de contacto y correo electrónico: si escribes a través del formulario o por correo electrónico, se tratan los datos que facilitas.',
        {
          list: [
            'Datos: nombre, dirección de correo electrónico, el servicio que te interesa (si lo indicas) y el contenido del mensaje.',
            'Finalidad: confirmarte por correo que el mensaje ha llegado, responder a tu consulta y, si lo pides, preparar un presupuesto. No se usan para enviarte publicidad ni boletines.',
            `Base legal: tu consentimiento, que das al marcar la casilla del formulario (artículo 6.1.a del RGPD), y la aplicación de medidas precontractuales a petición tuya (artículo 6.1.b). Puedes retirar el consentimiento en cualquier momento escribiendo a ${CONTACT_EMAIL}.`,
            'Datos necesarios: el nombre, el correo, el mensaje y la aceptación de esta política son imprescindibles para poder responderte.',
            'Conservación: el formulario no guarda los mensajes en este sitio web; se envían directamente al correo de la autora. Se conservan mientras dure la conversación y, como máximo, un año después de la última comunicación. Si se inicia una relación profesional, se conservan durante los plazos que exige la ley, por ejemplo la normativa fiscal.',
            'Protección frente al abuso: para impedir envíos automáticos, la dirección IP se usa de forma temporal para limitar el número de mensajes. La base legal es el interés legítimo en proteger el sitio (artículo 6.1.f del RGPD).',
            'Menores: si tienes menos de 14 años, no envíes el formulario sin el consentimiento de tus padres o tutores (artículo 7 de la LOPDGDD).',
          ],
        },
        'Destinatarios: los datos no se ceden a terceros, salvo obligación legal. Acceden a ellos, como encargados del tratamiento y con contrato, los proveedores que alojan el sitio web, el servicio que entrega los mensajes del formulario y el proveedor de correo electrónico (Google). Algunos están en Estados Unidos: esas transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea.',
        `Derechos: puedes pedir el acceso, la rectificación, la supresión, la oposición, la limitación del tratamiento y la portabilidad de tus datos, y retirar tu consentimiento, escribiendo a ${CONTACT_EMAIL}. Si consideras que no se han respetado, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).`,
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
        'Navegació: aquest lloc web no fa servir publicitat, eines de tercers com Google Analytics ni galetes de seguiment. Només desa al teu navegador les teves preferències (idioma i vista dels projectes), que són tècniques i necessàries per al funcionament del lloc i estan exemptes de consentiment (article 22.2 de la LSSI). Per seguretat, el proveïdor d’allotjament pot registrar dades tècniques com l’adreça IP.',
        'Estadístiques de visites: la web compta les seves visites amb un sistema propi, anònim i sense galetes, per saber quines pàgines i projectes interessen i d’on arriben les visites.',
        {
          list: [
            'Què es registra: la pàgina visitada, la web des de la qual arribes (si el teu navegador la indica), el país de la connexió, l’idioma triat a la web, el tipus de dispositiu (ordinador, mòbil o tauleta), el temps que la pàgina és a la vista, fins on es llegeix i algunes accions a la web, com obrir una imatge o començar a escriure al formulari.',
            'Com s’evita identificar-te: no es desa res al teu dispositiu. Per no comptar dues vegades la mateixa persona, la teva adreça IP i les dades del teu navegador es combinen amb una clau secreta que canvia cada dia i es transformen en un codi; l’adreça IP no es desa i la clau s’esborra l’endemà, de manera que ningú no pot saber qui ets ni seguir les teves visites d’un dia a l’altre. El país es calcula al servidor de la web a partir d’aquesta mateixa adreça IP, amb la base de dades «IP to Country Lite» de DB-IP.com (llicència CC BY 4.0), i la IP es descarta de seguida.',
            'Base legal: l’interès legítim a conèixer, de manera agregada, com s’utilitza la web i millorar-la (article 6.1.f del RGPD).',
            'Conservació: els registres s’esborren als 13 mesos.',
            'Destinataris: ningú; les dades només són al servidor de la mateixa web i no s’envien a cap servei extern d’estadístiques.',
            `Oposició: si el teu navegador envia el senyal de «no rastrejar» o Global Privacy Control, les teves visites no es compten. També t’hi pots oposar en qualsevol moment escrivint a ${CONTACT_EMAIL}.`,
          ],
        },
        'Formulari de contacte i correu electrònic: si escrius a través del formulari o per correu electrònic, es tracten les dades que facilites.',
        {
          list: [
            'Dades: nom, adreça de correu electrònic, el servei que t’interessa (si l’indiques) i el contingut del missatge.',
            'Finalitat: confirmar-te per correu que el missatge ha arribat, respondre la teva consulta i, si ho demanes, preparar un pressupost. No es fan servir per enviar-te publicitat ni butlletins.',
            `Base legal: el teu consentiment, que dones en marcar la casella del formulari (article 6.1.a del RGPD), i l’aplicació de mesures precontractuals a petició teva (article 6.1.b). Pots retirar el consentiment en qualsevol moment escrivint a ${CONTACT_EMAIL}.`,
            'Dades necessàries: el nom, el correu, el missatge i l’acceptació d’aquesta política són imprescindibles per poder respondre’t.',
            'Conservació: el formulari no desa els missatges en aquest lloc web; s’envien directament al correu de l’autora. Es conserven mentre duri la conversa i, com a màxim, un any després de la darrera comunicació. Si s’inicia una relació professional, es conserven durant els terminis que exigeix la llei, per exemple la normativa fiscal.',
            'Protecció davant l’abús: per impedir enviaments automàtics, l’adreça IP es fa servir de manera temporal per limitar el nombre de missatges. La base legal és l’interès legítim a protegir el lloc (article 6.1.f del RGPD).',
            'Menors: si tens menys de 14 anys, no enviïs el formulari sense el consentiment dels teus pares o tutors (article 7 de la LOPDGDD).',
          ],
        },
        'Destinataris: les dades no es cedeixen a tercers, llevat d’obligació legal. Hi accedeixen, com a encarregats del tractament i amb contracte, els proveïdors que allotgen el lloc web, el servei que lliura els missatges del formulari i el proveïdor de correu electrònic (Google). Alguns són als Estats Units: aquestes transferències s’emparen en el Marc de Privacitat de Dades UE-EUA o en les clàusules contractuals tipus de la Comissió Europea.',
        `Drets: pots demanar l’accés, la rectificació, la supressió, l’oposició, la limitació del tractament i la portabilitat de les teves dades, i retirar el teu consentiment, escrivint a ${CONTACT_EMAIL}. Si consideres que no s’han respectat, pots reclamar davant l’Agència Espanyola de Protecció de Dades (www.aepd.es).`,
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
        'Browsing: this website uses no advertising, no third-party tools such as Google Analytics and no tracking cookies. It only stores your preferences (language and project view) in your browser; these are technical, necessary for the site to work and exempt from consent (article 22.2 LSSI). For security, the hosting provider may log technical data such as your IP address.',
        'Visit statistics: the site counts its visits with its own anonymous, cookie-free system, to learn which pages and projects interest people and where visits come from.',
        {
          list: [
            'What is recorded: the page visited, the website you came from (if your browser shares it), the country of the connection, the language chosen on the site, the type of device (computer, phone or tablet), how long the page is in view, how far down it is read and a few actions on the site, such as opening an image or starting to write in the form.',
            'How you are kept unidentified: nothing is stored on your device. So that the same person is not counted twice, your IP address and browser details are combined with a secret key that changes every day and turned into a code; the IP address is not stored and the key is deleted the next day, so nobody can tell who you are or follow your visits from one day to the next. The country is worked out on the website’s own server from that same IP address, using the “IP to Country Lite” database by DB-IP.com (CC BY 4.0 licence), and the IP is discarded straight away.',
            'Legal basis: the legitimate interest in understanding, in aggregate, how the site is used and improving it (article 6.1.f GDPR).',
            'Retention: records are deleted after 13 months.',
            'Recipients: nobody; the data stays only on the website’s own server and is not sent to any external analytics service.',
            `Objection: if your browser sends a “Do Not Track” or Global Privacy Control signal, your visits are not counted. You can also object at any time by writing to ${CONTACT_EMAIL}.`,
          ],
        },
        'Contact form and email: if you write through the form or by email, the data you provide is processed.',
        {
          list: [
            'Data: name, email address, the service you are interested in (if you choose one) and the content of your message.',
            'Purpose: to confirm by email that your message has arrived, to answer your enquiry and, if you ask for one, to prepare a quote. It is not used to send you advertising or newsletters.',
            `Legal basis: your consent, given by ticking the box in the form (article 6.1.a GDPR), and pre-contractual measures taken at your request (article 6.1.b). You can withdraw your consent at any time by writing to ${CONTACT_EMAIL}.`,
            'Required data: your name, email, message and acceptance of this policy are needed to be able to reply.',
            'Retention: the form does not store messages on this website; they are sent straight to the author’s email. They are kept while the conversation lasts and at most one year after the last exchange. If a professional relationship begins, they are kept for the periods required by law, such as tax rules.',
            'Abuse prevention: to stop automated submissions, your IP address is used temporarily to limit the number of messages. The legal basis is the legitimate interest in protecting the site (article 6.1.f GDPR).',
            'Minors: if you are under 14, do not send the form without the consent of your parents or guardians (article 7 LOPDGDD).',
          ],
        },
        'Recipients: data is not shared with third parties except where required by law. The providers that host the website, the service that delivers the form messages and the email provider (Google) access it as data processors under contract. Some are in the United States: those transfers rely on the EU-US Data Privacy Framework or the European Commission’s standard contractual clauses.',
        `Your rights: you can request access, rectification, erasure, objection, restriction of processing and portability of your data, and withdraw your consent, by writing to ${CONTACT_EMAIL}. If you believe your rights have not been respected, you can complain to the Spanish Data Protection Agency (www.aepd.es).`,
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

// The privacy section's anchor in each language, for links from the contact form.
export const PRIVACY_ANCHOR: Record<string, string> = {
  es: 'privacidad',
  ca: 'privacitat',
  en: 'privacy',
};

export const LEGAL_COPY: Record<string, LegalCopy> = { es, ca, en };
