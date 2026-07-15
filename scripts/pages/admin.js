(function () {
  "use strict";
  const view = document.body.dataset.adminView;
  const text = (value) => String(value ?? "");
  const getJson = (name, fallback) => { try { return JSON.parse(window.TaranStorage?.get(name, JSON.stringify(fallback)) ?? JSON.stringify(fallback)); } catch (_error) { return fallback; } };
  const reviewCount = (item) => (Array.isArray(item.reviews) ? item.reviews.length : 0) + (Array.isArray(item.externalReviews) ? item.externalReviews.length : 0);
  const providers = (window.publicDirectoryData || []).filter((item) => item.publicationStatus !== "hidden");
  const element = (tag, value, className) => { const node = document.createElement(tag); if (value !== undefined) node.textContent = text(value); if (className) node.className = className; return node; };

  function metric(label, value) { const card=element("article",undefined,"admin-metric"); card.append(element("span",label),element("strong",value)); return card; }
  function dashboard() {
    const inquiries=getJson("provider-contributions",[]); const banners=getJson("admin-banners",[]); const articles=(window.TaranBlogPosts||window.taran_BLOG_POSTS||window.blogData||[]);
    const metrics=document.querySelector("[data-admin-metrics]");
    [["견적 검토 대기",inquiries.length],["공개 업체",providers.length],["준비백과 글",articles.length],["진행 중 배너",banners.filter(x=>x.status==="active").length]].forEach(([label,value])=>metrics?.append(metric(label,value.toLocaleString("ko-KR"))));
    const tasks=document.querySelector("[data-admin-tasks]");
    [["견적 검토",inquiries.length,"admin/inquiries.html"],["업체 정보 관리",providers.length,"admin/providers.html"],["배너 점검",banners.length,"admin/banners.html"]].forEach(([label,value,href])=>{ const link=element("a",undefined,"admin-task"); link.href=href; link.append(element("span",label),element("strong",value)); tasks?.append(link); });
  }

  function providerRows() {
    const table=document.querySelector("[data-admin-table]"); const form=document.querySelector("[data-admin-filter]"); const count=document.querySelector("[data-admin-result-count]"); let page=1; const size=30;
    const render=()=>{ const query=form?.elements.query.value.trim().toLowerCase()||""; const status=form?.elements.status.value||"all"; const all=(window.publicDirectoryData||[]).filter(item=>(!query||[item.name,item.region,item.area].join(" ").toLowerCase().includes(query))&&(status==="all"||(status==="published"?item.publicationStatus!=="hidden":item.publicationStatus==="hidden"))); table.replaceChildren(); all.slice((page-1)*size,page*size).forEach(item=>{ const row=document.createElement("tr"); const cells=[item.name,[item.region,item.area].filter(Boolean).join(" "),item.category||item.subcategory||"-",`${reviewCount(item)}개`]; cells.forEach(value=>row.append(element("td",value))); const state=element("span",item.publicationStatus==="hidden"?"비공개":"공개",`admin-status${item.publicationStatus==="hidden"?" is-hidden":""}`); const stateCell=document.createElement("td");stateCell.append(state);row.append(stateCell); const manage=document.createElement("td"); const link=element("a","상세 보기");link.href=`../provider.html?id=${encodeURIComponent(item.id)}`;manage.append(link);row.append(manage);table.append(row); }); if(count)count.textContent=`검색 결과 ${all.length.toLocaleString("ko-KR")}개`; renderPagination(all.length); };
    const renderPagination=(total)=>{ const nav=document.querySelector("[data-admin-pagination]");nav.replaceChildren();const pages=Math.ceil(total/size);const start=Math.max(1,Math.min(page-2,pages-4));const end=Math.min(pages,start+4);const add=(label,target,current=false)=>{const button=element("button",label,current?"is-current":"");button.type="button";button.disabled=target<1||target>pages;button.addEventListener("click",()=>{page=target;render();});nav.append(button);};add("이전",page-1);for(let i=start;i<=end;i+=1)add(i,i,i===page);add("다음",page+1); };
    form?.addEventListener("submit",event=>{event.preventDefault();page=1;render();}); render();
  }

  function contentRows() {
    const table=document.querySelector("[data-admin-table]"); const posts=window.TaranBlogPosts||window.taran_BLOG_POSTS||window.blogData||window.articleData||[];
    posts.forEach(post=>{const row=document.createElement("tr");[post.title||"제목 없음",post.category||post.topic||"준비백과",post.status||"공개",post.publishedAt||post.date||"-"].forEach(value=>row.append(element("td",value)));const manage=document.createElement("td");const link=element("a","글 보기");link.href=`../article.html?slug=${encodeURIComponent(post.slug||"")}`;manage.append(link);row.append(manage);table?.append(row);});
  }

  function inquiryRows() {
    const table=document.querySelector("[data-admin-table]"); const rows=getJson("provider-contributions",[]); document.querySelector("[data-admin-empty]").hidden=Boolean(rows.length);
    rows.forEach(item=>{const row=document.createElement("tr");[String(item.submittedAt||"").slice(0,10),item.providerName||"-",item.eventType||"-",item.quoteAmount||"-","검토 대기"].forEach(value=>row.append(element("td",value)));table?.append(row);});
  }
  function bannerRows() { const table=document.querySelector("[data-admin-table]"); const rows=getJson("admin-banners",[]); document.querySelector("[data-admin-empty]").hidden=Boolean(rows.length); rows.forEach(item=>{const row=document.createElement("tr");[item.title||item.name||"배너",item.placement||"-",[item.startDate,item.endDate].filter(Boolean).join(" ~ ")||"상시",item.status||"임시 저장","수정"].forEach(value=>row.append(element("td",value)));table?.append(row);}); }
  if(view==="dashboard")dashboard(); if(view==="providers")providerRows(); if(view==="content")contentRows(); if(view==="inquiries")inquiryRows(); if(view==="banners")bannerRows();
})();
