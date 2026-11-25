/** Optional redirect in the personal account; the main deploy uses Pages. */
export default {
  /** Preserve the requested path and query in the personal Pages URL. */
  fetch(request:Request) {
    const previous=new URL(request.url),target=new URL('https://dcarvalho-tarefas-pessoal.pages.dev');
    target.pathname=previous.pathname;target.search=previous.search;
    return Response.redirect(target.toString(),308);
  }
};
