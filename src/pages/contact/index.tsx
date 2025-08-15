import { useForm } from 'react-hook-form';
import './index.scss';
import { useCallback, useEffect, useState } from 'react';
import { fetchContactFromAPI } from '../../services/contact/api-request';
import { useLang } from '../../context/lang-context';

function Contact() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const { lang } = useLang();

  const [contactData, setContactData] = useState<any>(null);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = useCallback(async () => {
    const response = await fetchContactFromAPI();
    setContactData(response);
  }, []);

  const onSubmit = (data: any) => {
    alert(JSON.stringify(data, null, 2));
    reset();
  };

  return (
    <div className="contact-container">
      <h1>{contactData?.[0]?.title_i18n?.[lang]}</h1>
      <div className="contact-description">{contactData?.[0]?.description_i18n?.[lang]}</div>
      <form className="contact-form-container" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="contact-field-container">
          <input
            className="contact-field"
            placeholder="Name"
            id="name"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Minimum 2 characters' },
            })}
          />
          {errors.name?.message && typeof errors.name.message === 'string' && (
            <p className="contact-error-message">{errors.name.message}</p>
          )}
        </div>

        <div className="contact-field-container">
          <input
            className="contact-field"
            placeholder="Email"
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email?.message && typeof errors.email.message === 'string' && (
            <p className="contact-error-message">{errors.email.message}</p>
          )}
        </div>

        <div className="contact-field-container">
          <textarea
            className="contact-field-textarea"
            placeholder="Message"
            id="message"
            {...register('message', {
              required: 'Message is required',
              minLength: { value: 10, message: 'Minimum 10 characters' },
            })}
          />

          {errors.message?.message && typeof errors.message.message === 'string' && (
            <p className="contact-error-message">{errors.message.message}</p>
          )}
        </div>

        <button className="contact-submit-button" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default Contact;
