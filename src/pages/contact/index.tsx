import { useForm } from 'react-hook-form';
import './index.scss';

function Contact() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data: any) => {
    alert(JSON.stringify(data, null, 2));
    reset();
  };

  return (
    <div className="contact-container">
      <h1>Contact</h1>
      <div>
        please don't hesitate to bother me with collabs, requests, dreams, fears, sweet talk,
        brownie recipes etc...
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="contact-field-container">
          <label htmlFor="name">Name:</label>
          <input
            className="contact-field"
            id="name"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Minimum 2 characters' },
            })}
          />
          {errors.name?.message && typeof errors.name.message === 'string' && (
            <p style={{ color: 'red' }}>{errors.name.message}</p>
          )}
        </div>

        <div className="contact-field-container">
          <label htmlFor="email">Email:</label>
          <input
            className="contact-field"
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
            <p style={{ color: 'red' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="contact-field-container">
          <label htmlFor="message">Message:</label>
          <textarea
            className="contact-field-textarea"
            id="message"
            {...register('message', {
              required: 'Message is required',
              minLength: { value: 10, message: 'Minimum 10 characters' },
            })}
          />

          {errors.message?.message && typeof errors.message.message === 'string' && (
            <p style={{ color: 'red' }}>{errors.message.message}</p>
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
