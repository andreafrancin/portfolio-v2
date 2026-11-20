import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../context/lang-context';
import { sendContactMessage } from '../../services/contact/api-request';
import type { ServiceGroup } from '../../services/service-catalog/api-request';
import { fetchServiceGroups, pickText } from '../../services/service-catalog/api-request';
import { CONTACT_EMAIL, LEGAL_NAME } from '../../config/site';
import { PRIVACY_ANCHOR } from '../legal/content';
import Spinner from '../../components/spinner';
import { trackEvent } from '../../lib/analytics';
import { IconArrowRight, IconCheck } from '../../components/icons';

type Field = 'name' | 'email' | 'message' | 'consent';
type Errors = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

const EMPTY = { name: '', email: '', service: '', message: '', website: '' };

function ContactForm() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef(false);
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'limited'>('idle');
  const [groups, setGroups] = useState<ServiceGroup[]>([]);

  const loadingServices = useRef(false);
  const loadServices = useCallback(() => {
    if (loadingServices.current) return;
    loadingServices.current = true;
    fetchServiceGroups()
      .then((response) => setGroups(Array.isArray(response) ? response : []))
      .catch(() => undefined)
      .finally(() => {
        loadingServices.current = false;
      });
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const set =
    (key: keyof typeof EMPTY) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((v) => ({ ...v, [key]: value }));
      if (errors[key as Field]) setErrors((e) => ({ ...e, [key]: undefined }));
    };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!values.name.trim()) found.name = t('CONTACT.FORM.ERROR_NAME');
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = t('CONTACT.FORM.ERROR_EMAIL');
    if (values.message.trim().length < MESSAGE_MIN) {
      found.message = t('CONTACT.FORM.ERROR_MESSAGE', { count: MESSAGE_MIN });
    }
    if (!consent) found.consent = t('CONTACT.FORM.ERROR_CONSENT');
    return found;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === 'sending') return;
    const found = validate();
    setErrors(found);
    const first = (['name', 'email', 'message', 'consent'] as Field[]).find((f) => found[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setState('sending');
    try {
      await sendContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        service: values.service,
        message: values.message.trim(),
        consent: true,
        language: lang,
        website: values.website,
      });
      // Services are counted under their Spanish name, whatever language the visitor used.
      const chosen = groups
        .flatMap((group) => group.services)
        .find((service) => pickText(service.name_i18n, lang) === values.service);
      trackEvent('contact_sent', chosen ? pickText(chosen.name_i18n, 'es') : values.service);
      setState('sent');
      setValues(EMPTY);
      setConsent(false);
    } catch (error) {
      setState(String((error as Error)?.message).includes('429') ? 'limited' : 'failed');
    }
  };

  if (state === 'sent') {
    return (
      <div className="contact-form contact-form--sent" role="status">
        <span className="contact-form__done" aria-hidden="true">
          <IconCheck size={28} />
        </span>
        <h2 className="contact-form__title">{t('CONTACT.FORM.SENT_TITLE')}</h2>
        <p className="contact-form__text">{t('CONTACT.FORM.SENT_TEXT')}</p>
        <button type="button" className="btn btn--quiet" onClick={() => setState('idle')}>
          {t('CONTACT.FORM.SEND_ANOTHER')}
        </button>
      </div>
    );
  }

  const fieldId = (name: string) => `${id}-${name}`;
  const errorFor = (name: Field) =>
    errors[name] ? (
      <p className="contact-form__error" id={fieldId(`${name}-error`)}>
        {errors[name]}
      </p>
    ) : null;
  const describedBy = (name: Field, extra?: string) =>
    [errors[name] ? fieldId(`${name}-error`) : '', extra || ''].filter(Boolean).join(' ') ||
    undefined;

  return (
    <form
      ref={formRef}
      className="contact-form"
      onSubmit={onSubmit}
      onFocus={() => {
        if (startedRef.current) return;
        startedRef.current = true;
        trackEvent('contact_start');
      }}
      noValidate
    >
      <h2 className="contact-form__title">{t('CONTACT.FORM.TITLE')}</h2>

      <div className="contact-form__row">
        <div className="field">
          <label className="field__label" htmlFor={fieldId('name')}>
            {t('CONTACT.FORM.NAME')}
          </label>
          <input
            id={fieldId('name')}
            name="name"
            className="input"
            autoComplete="name"
            maxLength={120}
            value={values.name}
            onChange={set('name')}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={describedBy('name')}
            required
          />
          {errorFor('name')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor={fieldId('email')}>
            {t('CONTACT.FORM.EMAIL')}
          </label>
          <input
            id={fieldId('email')}
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={values.email}
            onChange={set('email')}
            aria-invalid={!!errors.email || undefined}
            aria-describedby={describedBy('email')}
            required
          />
          {errorFor('email')}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('service')}>
          {t('CONTACT.FORM.SERVICE')}{' '}
          <span className="contact-form__optional">{t('CONTACT.FORM.OPTIONAL')}</span>
        </label>
        <select
          id={fieldId('service')}
          name="service"
          className="input contact-form__select"
          value={values.service}
          onChange={set('service')}
          onFocus={() => {
            if (groups.length === 0) loadServices();
          }}
        >
          <option value="">{t('CONTACT.FORM.SERVICE_NONE')}</option>
          {groups
            .flatMap((group) => group.services)
            .map((service) => {
              const name = pickText(service.name_i18n, lang);
              return (
                <option key={service.id} value={name}>
                  {name}
                </option>
              );
            })}
          <option value={t('CONTACT.FORM.SERVICE_OTHER')}>{t('CONTACT.FORM.SERVICE_OTHER')}</option>
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={fieldId('message')}>
          {t('CONTACT.FORM.MESSAGE')}
        </label>
        <textarea
          id={fieldId('message')}
          name="message"
          className="input"
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder={t('CONTACT.FORM.MESSAGE_PLACEHOLDER')}
          value={values.message}
          onChange={set('message')}
          aria-invalid={!!errors.message || undefined}
          aria-describedby={describedBy('message')}
          required
        />
        {errorFor('message')}
      </div>

      {/* Hidden from people: only bots fill it in. */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor={fieldId('website')}>Website</label>
        <input
          id={fieldId('website')}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <div className="contact-form__privacy" id={fieldId('privacy')}>
        <p>
          <strong>{t('CONTACT.FORM.PRIVACY_TITLE')}</strong>{' '}
          {t('CONTACT.FORM.PRIVACY_TEXT', { owner: LEGAL_NAME, email: CONTACT_EMAIL })}{' '}
          <Link to={`/legal#${PRIVACY_ANCHOR[lang] || PRIVACY_ANCHOR.es}`} target="_blank">
            {t('CONTACT.FORM.PRIVACY_LINK')}
          </Link>
        </p>
      </div>

      <div className="contact-form__consent">
        <label className="contact-form__check">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent) setErrors((x) => ({ ...x, consent: undefined }));
            }}
            aria-invalid={!!errors.consent || undefined}
            aria-describedby={describedBy('consent', fieldId('privacy'))}
          />
          <span>
            {t('CONTACT.FORM.CONSENT_BEFORE')}{' '}
            <Link to={`/legal#${PRIVACY_ANCHOR[lang] || PRIVACY_ANCHOR.es}`} target="_blank">
              {t('CONTACT.FORM.CONSENT_LINK')}
            </Link>
          </span>
        </label>
        {errorFor('consent')}
      </div>

      {(state === 'failed' || state === 'limited') && (
        <p className="contact-form__alert" role="alert">
          {t(state === 'limited' ? 'CONTACT.FORM.LIMITED' : 'CONTACT.FORM.FAILED')}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}

      <button type="submit" className="btn contact-form__submit" disabled={state === 'sending'}>
        {state === 'sending' ? <Spinner size={18} /> : null}
        {t(state === 'sending' ? 'CONTACT.FORM.SENDING' : 'CONTACT.FORM.SEND')}
        {state !== 'sending' && <IconArrowRight size={18} />}
      </button>
    </form>
  );
}

export default ContactForm;
