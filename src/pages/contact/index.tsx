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
      <p className="contact-description">{contactData?.[0]?.description_i18n?.[lang]}</p>
      <a className="contact-email" href="mailto:andrea@example.com">
        andfrancín@gmail.com
      </a>
    </div>
  );
}

export default Contact;
