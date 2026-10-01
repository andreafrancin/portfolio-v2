import { useLang } from '../../context/lang-context';
import { LEGAL_UPDATED } from '../../config/site';
import { LEGAL_COPY } from './content';
import useSeo from '../../seo/useSeo';
import { PAGE_META } from '../../seo/meta';
import './index.scss';

function Legal() {
  const { lang } = useLang();
  const copy = LEGAL_COPY[lang] || LEGAL_COPY.es;
  useSeo({ title: PAGE_META.legal.title[lang], description: PAGE_META.legal.description[lang] });
  const updated = new Date(`${LEGAL_UPDATED}T12:00:00`).toLocaleDateString(lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="legal">
      <header className="legal__head">
        <h1 className="legal__title">{copy.title}</h1>
        <p className="legal__intro">{copy.intro}</p>
        <p className="legal__updated">
          {copy.updatedLabel}: <time dateTime={LEGAL_UPDATED}>{updated}</time>
        </p>
      </header>

      <nav className="legal__toc" aria-label={copy.contents}>
        <ol>
          {copy.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="legal__body">
        {copy.sections.map((s) => (
          <section key={s.id} id={s.id} className="legal__section">
            <h2>{s.title}</h2>
            {s.blocks.map((b, i) =>
              typeof b === 'string' ? (
                <p key={i}>{b}</p>
              ) : (
                <ul key={i}>
                  {b.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

export default Legal;
