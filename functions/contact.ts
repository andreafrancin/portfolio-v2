import { PAGE_META } from '../src/seo/meta';
import { withSeo } from '../functions-lib/seo';

export const onRequest = (context: any) =>
  withSeo(context, (lang) => ({
    title: PAGE_META.contact.title[lang],
    description: PAGE_META.contact.description[lang],
  }));
