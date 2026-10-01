import { PAGE_META } from '../src/seo/meta';
import { withSeo } from '../functions-lib/seo';

export const onRequest = (context: any) =>
  withSeo(context, (lang) => ({
    title: PAGE_META.about.title[lang],
    description: PAGE_META.about.description[lang],
  }));
