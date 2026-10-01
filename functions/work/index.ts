import { PAGE_META } from '../../src/seo/meta';
import { withSeo } from '../../functions-lib/seo';

export const onRequest = (context: any) =>
  withSeo(context, (lang) => ({
    title: PAGE_META.work.title[lang],
    description: PAGE_META.work.description[lang],
  }));
