export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  return Response.redirect(`${url.origin}/work${url.search}`, 301);
};
