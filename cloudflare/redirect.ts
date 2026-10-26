export default {
  fetch(request:Request) {
    const previous=new URL(request.url),target=new URL('https://dcarvalho-tarefas.pages.dev');
    target.pathname=previous.pathname;target.search=previous.search;
    return Response.redirect(target.toString(),308);
  }
};
