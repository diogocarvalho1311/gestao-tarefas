import { ExternalLink } from 'lucide-react';

type Link={label:string;href:string};
const clientLinks:Record<string,Link[]>={
  Lucri:[
    {label:'Dashboard Lucri',href:'https://dashlucri.pages.dev/'},
    {label:'Meta Ads',href:'https://adsmanager.facebook.com/adsmanager/manage/campaigns?global_scope_id=570098705543197&business_id=570098705543197&act=2500334253718767&nav_entry_point=am_global_scope_selector&redirect_session_id=ef3bb1d3-eaf0-4d05-9749-5ded09e3f34a&columns=name%2Cdelivery%2Cresults%2Ccost_per_result%2Ccustom_derived_metrics%3A1562012808845518%2Cbudget%2Cspend%2Cimpressions%2Ccpm%2Creach%2Cactions%3Alink_click%2Cwebsite_ctr%3Alink_click%2Ccost_per_action_type%3Alink_click%2Cfrequency%2Ccampaign_name%2Cactions%3Avideo_view%2Clanding_page_view_per_link_click%2Cclicks%2Cctr%2Cadgroup_id%2Cactions%3Aomni_landing_page_view%2Cactions%3Apost_engagement%2Cactions%3Apage_engagement%2Cinstagram_profile_follow_v2&attribution_windows=default'},
  ],
  'CWB Kids':[
    {label:'Nuvemshop',href:'https://cwbcompras.lojavirtualnuvem.com.br/admin/orders?page=1&perPage=50'},
    {label:'Meta Ads',href:'https://adsmanager.facebook.com/adsmanager/manage/campaigns?global_scope_id=1268893393527949&business_id=1268893393527949&act=161715489279872&nav_entry_point=am_global_scope_selector&redirect_session_id=24f6e040-c70d-486e-b1b6-f991918576f7#'},
  ],
};
const academicLinks:Link[]=[
  {label:'UFPR Virtual',href:'https://ufprvirtual.ufpr.br/'},
  {label:'Teams',href:'https://teams.cloud.microsoft/'},
];

export default function WorkspaceLinks({client,academic}:{client:string;academic:boolean}) {
  const links=academic?academicLinks:clientLinks[client]||[];
  return <>{links.map(({label,href})=><a key={label} className="button" href={href} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>{label}</a>)}</>;
}
