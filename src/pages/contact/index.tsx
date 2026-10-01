import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchContactFromAPI } from '../../services/contact/api-request';
import { useLang } from '../../context/lang-context';
import { useToast } from '../../components/toast';
import { CONTACT_EMAIL, INSTAGRAM_URL, LINKEDIN_URL } from '../../config/site';
import { IconArrowUpRight, IconCopy, IconInstagram, IconLinkedin } from '../../components/icons';
import useSeo from '../../seo/useSeo';
import { PAGE_META } from '../../seo/meta';
import './index.scss';

let contactCache: any = null;

function Contact() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const toast = useToast();
  const [record, setRecord] = useState<any>(contactCache);
  useSeo({
    title: PAGE_META.contact.title[lang],
    description: PAGE_META.contact.description[lang],
  });

  const load = useCallback(async () => {
    try {
      const response = await fetchContactFromAPI();
      contactCache = response?.[0] || null;
      setRecord(contactCache);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      toast.success(t('CONTACT.COPIED'));
    } catch {}
  };

  const title = record?.title_i18n?.[lang];
  const description = record?.description_i18n?.[lang];

  return (
    <section className="contact">
      <div className="contact__sheet">
        <h1 className="contact__title">{title || t('HEADER.CONTACT')}</h1>
        {description && <p className="contact__lead">{description}</p>}

        <div className="contact__card">
          <p className="contact__label">{t('CONTACT.EMAIL')}</p>
          <a className="contact__email" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <div className="contact__actions">
            <button type="button" className="btn btn--quiet btn--sm" onClick={copyEmail}>
              <IconCopy size={16} /> {t('CONTACT.COPY')}
            </button>
            <a
              className="btn btn--quiet btn--sm"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
            >
              <IconInstagram size={16} /> {t('CONTACT.INSTAGRAM')} <IconArrowUpRight size={14} />
            </a>
            <a
              className="btn btn--quiet btn--sm"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
            >
              <IconLinkedin size={16} /> {t('CONTACT.LINKEDIN')} <IconArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
