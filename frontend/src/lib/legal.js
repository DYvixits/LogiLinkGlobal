// Legal documents content (FR/EN). Not legal advice — editable boilerplate.
const EDITOR = {
  name: "LOGILINK GLOBAL",
  address: "Via Roma 35, 26866 Lodi, Italie",
  phone: "+39 3287091255",
  email: "support@logilink.com",
  dev: "DYVIX IT Solutions",
  dev_url: "https://dyvixitsolutions.com",
  comm: "BusinessPro Operator",
  comm_url: "https://businesspro-operator.com",
};

export const LEGAL = {
  mentions: {
    fr: {
      title: "Mentions légales",
      updated: "Dernière mise à jour : Juin 2026",
      sections: [
        { h: "Éditeur du site", p: `Le présent site est édité par ${EDITOR.name}, service de transport de colis entre l'Europe et le Cameroun.\nAdresse : ${EDITOR.address}\nTéléphone : ${EDITOR.phone}\nEmail : ${EDITOR.email}` },
        { h: "Responsable de la publication", p: `${EDITOR.name}.` },
        { h: "Conception & développement", p: `Site conçu et développé par ${EDITOR.dev} (${EDITOR.dev_url}).` },
        { h: "Communication & marketing", p: `Communication assurée par ${EDITOR.comm} (${EDITOR.comm_url}).` },
        { h: "Hébergement", p: "Le site est hébergé sur une infrastructure cloud sécurisée. Les coordonnées de l'hébergeur sont disponibles sur simple demande." },
        { h: "Propriété intellectuelle", p: "L'ensemble des contenus (textes, logos, éléments graphiques) présents sur ce site est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite." },
      ],
    },
    en: {
      title: "Legal notice",
      updated: "Last updated: June 2026",
      sections: [
        { h: "Site publisher", p: `This website is published by ${EDITOR.name}, a parcel transport service between Europe and Cameroon.\nAddress: ${EDITOR.address}\nPhone: ${EDITOR.phone}\nEmail: ${EDITOR.email}` },
        { h: "Publication manager", p: `${EDITOR.name}.` },
        { h: "Design & development", p: `Website designed and developed by ${EDITOR.dev} (${EDITOR.dev_url}).` },
        { h: "Communication & marketing", p: `Communication handled by ${EDITOR.comm} (${EDITOR.comm_url}).` },
        { h: "Hosting", p: "The website is hosted on a secure cloud infrastructure. Hosting details are available on request." },
        { h: "Intellectual property", p: "All content (texts, logos, graphics) on this site is protected by intellectual property law. Any reproduction without authorization is prohibited." },
      ],
    },
  },
  cgu: {
    fr: {
      title: "Conditions Générales d'Utilisation (CGU)",
      updated: "Dernière mise à jour : Juin 2026",
      sections: [
        { h: "1. Objet", p: "Les présentes CGU régissent l'accès et l'utilisation de la plateforme LOGILINK GLOBAL, permettant l'enregistrement, l'expédition et le suivi de colis entre l'Europe et le Cameroun." },
        { h: "2. Accès au service", p: "Le suivi des colis et l'enregistrement d'un envoi sont accessibles sans création de compte. L'espace professionnel (backoffice) est réservé aux opérateurs, superviseurs et administrateurs disposant d'identifiants." },
        { h: "3. Obligations de l'utilisateur", p: "L'utilisateur s'engage à fournir des informations exactes (identité, coordonnées, contenu du colis) et à ne pas expédier d'objets interdits ou illégaux." },
        { h: "4. Suivi des colis", p: "Un numéro de suivi unique est attribué à chaque colis. L'utilisateur peut suivre l'état de son envoi à tout moment depuis la page de suivi." },
        { h: "5. Responsabilité", p: "LOGILINK GLOBAL met tout en œuvre pour assurer un service fiable mais ne saurait être tenu responsable des retards liés à des cas de force majeure ou aux contrôles douaniers." },
        { h: "6. Données personnelles", p: "Le traitement des données est décrit dans la Politique de confidentialité." },
        { h: "7. Modification des CGU", p: "LOGILINK GLOBAL se réserve le droit de modifier les présentes CGU à tout moment. La version applicable est celle en vigueur lors de l'utilisation du service." },
        { h: "8. Droit applicable", p: "Les présentes CGU sont soumises au droit applicable au siège de l'éditeur. Tout litige relève des juridictions compétentes." },
      ],
    },
    en: {
      title: "Terms of Use (ToU)",
      updated: "Last updated: June 2026",
      sections: [
        { h: "1. Purpose", p: "These Terms govern access to and use of the LOGILINK GLOBAL platform, which allows registering, shipping and tracking parcels between Europe and Cameroon." },
        { h: "2. Access to the service", p: "Parcel tracking and shipment registration are available without an account. The professional back office is reserved for operators, supervisors and administrators with credentials." },
        { h: "3. User obligations", p: "The user agrees to provide accurate information (identity, contact details, parcel content) and not to ship prohibited or illegal items." },
        { h: "4. Parcel tracking", p: "A unique tracking number is assigned to each parcel. The user can check the shipment status at any time from the tracking page." },
        { h: "5. Liability", p: "LOGILINK GLOBAL strives to provide a reliable service but cannot be held liable for delays due to force majeure or customs checks." },
        { h: "6. Personal data", p: "Data processing is described in the Privacy Policy." },
        { h: "7. Changes to the Terms", p: "LOGILINK GLOBAL reserves the right to amend these Terms at any time. The applicable version is the one in force at the time of use." },
        { h: "8. Governing law", p: "These Terms are governed by the law applicable at the publisher's registered office. Any dispute falls under the competent courts." },
      ],
    },
  },
  cgv: {
    fr: {
      title: "Conditions Générales de Vente (CGV)",
      updated: "Dernière mise à jour : Juin 2026",
      sections: [
        { h: "1. Objet", p: "Les présentes CGV encadrent les prestations de transport de colis proposées par LOGILINK GLOBAL entre l'Europe et le Cameroun." },
        { h: "2. Services proposés", p: "Envoi de colis dans les deux sens : Europe → Cameroun (départs le vendredi) et Cameroun → Europe (départs le samedi)." },
        { h: "3. Tarifs et facturation", p: "Les tarifs sont établis au poids selon la grille en vigueur, majorés le cas échéant de la TVA applicable. Le prix définitif est confirmé lors de la réception et de la pesée au dépôt. Une facture est remise sur demande." },
        { h: "4. Dépôt et expédition", p: "Le colis doit être déposé au point de collecte avec le ticket (QR code et code-barres) apposé. Les départs sont hebdomadaires selon la direction choisie." },
        { h: "5. Délais de livraison", p: "Les délais indiqués sont estimatifs. Ils peuvent varier selon les conditions de transport et les contrôles douaniers." },
        { h: "6. Objets interdits", p: "Sont interdits : produits dangereux, illégaux, périssables non autorisés, devises et tout objet contraire à la réglementation en vigueur." },
        { h: "7. Assurance et valeur déclarée", p: "Une assurance optionnelle peut être souscrite sur la base de la valeur déclarée du colis. À défaut, la responsabilité est limitée conformément aux conditions du transporteur." },
        { h: "8. Réclamations", p: "Toute réclamation doit être adressée au service client dans les meilleurs délais, avec le numéro de suivi correspondant." },
        { h: "9. Droit applicable", p: "Les présentes CGV sont soumises au droit applicable au siège de l'éditeur." },
      ],
    },
    en: {
      title: "Terms of Sale (ToS)",
      updated: "Last updated: June 2026",
      sections: [
        { h: "1. Purpose", p: "These Terms of Sale govern the parcel transport services offered by LOGILINK GLOBAL between Europe and Cameroon." },
        { h: "2. Services offered", p: "Parcel shipping both ways: Europe → Cameroon (Friday departures) and Cameroon → Europe (Saturday departures)." },
        { h: "3. Pricing and invoicing", p: "Prices are set by weight according to the current grid, plus applicable VAT where relevant. The final price is confirmed on reception and weighing at the depot. An invoice is provided on request." },
        { h: "4. Drop-off and shipping", p: "The parcel must be dropped off at the collection point with the ticket (QR code and barcode) attached. Departures are weekly depending on the chosen direction." },
        { h: "5. Delivery times", p: "Indicated times are estimates. They may vary depending on transport conditions and customs checks." },
        { h: "6. Prohibited items", p: "Prohibited: dangerous or illegal goods, unauthorized perishables, currency, and any item contrary to applicable regulations." },
        { h: "7. Insurance and declared value", p: "Optional insurance may be taken out based on the declared value of the parcel. Otherwise, liability is limited in accordance with the carrier's conditions." },
        { h: "8. Claims", p: "Any claim must be sent to customer service as soon as possible, with the corresponding tracking number." },
        { h: "9. Governing law", p: "These Terms of Sale are governed by the law applicable at the publisher's registered office." },
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      updated: "Dernière mise à jour : Juin 2026",
      sections: [
        { h: "1. Données collectées", p: "Nous collectons les données nécessaires à l'expédition : nom, téléphone, ville et adresse de l'expéditeur et du destinataire, description du contenu du colis." },
        { h: "2. Finalités", p: "Ces données servent à traiter l'expédition, assurer le suivi, générer les tickets et factures, et communiquer avec les parties (notifications)." },
        { h: "3. Base légale", p: "Le traitement repose sur l'exécution du contrat de transport et l'intérêt légitime de l'éditeur." },
        { h: "4. Durée de conservation", p: "Les données sont conservées le temps nécessaire au traitement des expéditions et au respect des obligations légales et comptables." },
        { h: "5. Destinataires", p: "Les données sont accessibles aux opérateurs et agences intervenant dans l'acheminement du colis. Elles ne sont pas revendues à des tiers." },
        { h: "6. Cookies", p: "Le site utilise un stockage local minimal (préférence de langue, session opérateur). Aucun cookie publicitaire n'est utilisé." },
        { h: "7. Vos droits", p: "Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous à support@logilink.com." },
        { h: "8. Sécurité", p: "Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données (accès restreint par rôles, connexions sécurisées)." },
      ],
    },
    en: {
      title: "Privacy Policy",
      updated: "Last updated: June 2026",
      sections: [
        { h: "1. Data collected", p: "We collect the data needed for shipping: name, phone, city and address of the sender and receiver, and the parcel content description." },
        { h: "2. Purposes", p: "This data is used to process the shipment, provide tracking, generate tickets and invoices, and communicate with the parties (notifications)." },
        { h: "3. Legal basis", p: "Processing is based on the performance of the transport contract and the publisher's legitimate interest." },
        { h: "4. Retention period", p: "Data is kept for as long as necessary to process shipments and comply with legal and accounting obligations." },
        { h: "5. Recipients", p: "Data is accessible to operators and agencies involved in delivering the parcel. It is not resold to third parties." },
        { h: "6. Cookies", p: "The site uses minimal local storage (language preference, operator session). No advertising cookies are used." },
        { h: "7. Your rights", p: "In accordance with regulations, you have the right to access, rectify and delete your data. Contact us at support@logilink.com." },
        { h: "8. Security", p: "We implement technical and organizational measures to protect your data (role-based restricted access, secure connections)." },
      ],
    },
  },
};

export const CREDITS = EDITOR;
