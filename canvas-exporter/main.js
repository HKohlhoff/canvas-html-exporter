"use strict";var y=Object.defineProperty;var z=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var N=Object.prototype.hasOwnProperty;var I=(t,e)=>{for(var n in e)y(t,n,{get:e[n],enumerable:!0})},X=(t,e,n,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of F(e))!N.call(t,i)&&i!==n&&y(t,i,{get:()=>e[i],enumerable:!(a=z(e,i))||a.enumerable});return t};var Y=t=>X(y({},"__esModule",{value:!0}),t);var j={};I(j,{default:()=>b});module.exports=Y(j);var d=require("obsidian");var L={1:"#fb464c",2:"#e9973f",3:"#e0de71",4:"#44cf6e",5:"#53dfdd",6:"#a882ff"};function M(t){return t?L[t]??(t.startsWith("#")?t:""):""}function w(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function u(t){let e=w(t).replace(/\n/g,"<br>");return e=e.replace(/\[\^(\w+)\]/g,'<sup class="footnote-ref">[$1]</sup>'),e=e.replace(/(?<!\w)#(\w[\w\/-]*)/g,'<span class="tag">#$1</span>'),e=e.replace(/==([^=]+)==/g,"<mark>$1</mark>"),e=e.replace(/~~(.+?)~~/g,"<del>$1</del>"),e=e.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,"<em>$1</em>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/_(?![^_]*_)((?:[^_]|_(?!_))*?)_/g,"<em>$1</em>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/!\[\[([^\]]+?)(?:\|(\d+)(?:x(\d+))?)?\]\]/g,(n,a,i,s)=>{let r=[];i&&r.push(`width:${i}px`),s&&r.push(`height:${s}px`);let c=r.length?` style="${r.join(";")}"`:"";return`<img src="${a}" alt="${a}"${c}>`}),e=e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">'),e=e.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'<a class="internal-link" href="#n-$1">$2</a>'),e=e.replace(/\[\[([^\]]+)\]\]/g,'<a class="internal-link" href="#n-$1">$1</a>'),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e}function T(t){if(!t)return"";let e=t.split(`
`),n=[],a=0;for(;a<e.length;){let i=e[a],s=i.trim();if(s.startsWith("```")){let o=s.slice(3).trim(),l=[];for(a++;a<e.length&&!e[a].trim().startsWith("```");)l.push(w(e[a])),a++;n.push(`<pre><code class="language-${o}">${l.join(`
`)}</code></pre>`),a++;continue}let r=s.match(/^(#{1,6})\s+(.*)/);if(r){let o=r[1].length;n.push(`<h${o}>${u(r[2])}</h${o}>`),a++;continue}if(/^(-{3,}|\*{3,}|_{3,})$/.test(s)){n.push("<hr>"),a++;continue}if(s.match(/^(\s*)-\s\[([ xX])\]\s+(.*)/)){let o=[];for(;a<e.length;){let l=e[a].trim().match(/^(\s*)-\s\[([ xX])\]\s+(.*)/);if(!l)break;let g=l[2].toLowerCase()==="x"?"checked":"";o.push(`<li class="task-item"><input type="checkbox" ${g} disabled> ${u(l[3])}</li>`),a++}n.push(`<ul class="checklist">${o.join("")}</ul>`);continue}if(s.match(/^[-*+]\s/)){let o=[];for(;a<e.length&&e[a].trim().match(/^[-*+]\s/);){let l=e[a].trim().match(/^[-*+]\s+(.*)/);if(!l)break;o.push(`<li>${u(l[1])}</li>`),a++}n.push(`<ul>${o.join("")}</ul>`);continue}if(s.match(/^\d+\.\s/)){let o=[];for(;a<e.length&&e[a].trim().match(/^\d+\.\s/);){let l=e[a].trim().match(/^\d+\.\s+(.*)/);if(!l)break;o.push(`<li>${u(l[1])}</li>`),a++}n.push(`<ol>${o.join("")}</ol>`);continue}if(s.startsWith("> ")){let o=[];for(;a<e.length&&e[a].trim().startsWith("> ");)o.push(e[a].trim().slice(2)),a++;n.push(`<blockquote>${u(o.join(" "))}</blockquote>`);continue}if(s.startsWith("|")){let o=[];for(;a<e.length&&e[a].trim().startsWith("|");)o.push(e[a].trim()),a++;let g=o.map(p=>p.split("|").slice(1,-1).map(h=>h.trim())).filter(p=>p.length>0).filter(p=>!p.every(h=>/^[-:]+$/.test(h)));if(g.length>0){let p="<table>";g.forEach((h,f)=>{let m=f===0?"th":"td";p+=`<tr>${h.map(x=>`<${m}>${u(x)}</${m}>`).join("")}</tr>`}),p+="</table>",n.push(p)}continue}if(s===""){n.push(""),a++;continue}n.push(`<p>${u(i)}</p>`),a++}return n.join(`
`)}function S(t,e){let n=t.x+t.width/2,a=t.y+t.height/2;switch(e){case"top":return{x:n,y:t.y};case"bottom":return{x:n,y:t.y+t.height};case"left":return{x:t.x,y:a};case"right":return{x:t.x+t.width,y:a};default:return{x:n,y:a}}}function H(t,e,n,a){let i=e.x-t.x,s=e.y-t.y,r=Math.sqrt(i*i+s*s),c=Math.min(r*.4,200),o={right:[c,0],left:[-c,0],bottom:[0,c],top:[0,-c]},l=o[n]??[c,0],g=o[a]??[-c,0];return`M ${t.x.toFixed(1)} ${t.y.toFixed(1)} C ${(t.x+l[0]).toFixed(1)} ${(t.y+l[1]).toFixed(1)}, ${(e.x+g[0]).toFixed(1)} ${(e.y+g[1]).toFixed(1)}, ${e.x.toFixed(1)} ${e.y.toFixed(1)}`}function A(t,e=80){if(t.nodes.length===0)return{width:1200,height:900};let n=Math.min(...t.nodes.map(r=>r.x)),a=Math.min(...t.nodes.map(r=>r.y));t.nodes.forEach(r=>{r.x+=e-n,r.y+=e-a});let i=Math.max(...t.nodes.map(r=>r.x+r.width))+e,s=Math.max(...t.nodes.map(r=>r.y+r.height))+e;return{width:i,height:s}}function O(t){let e=M(t.color),n=e?`border-left: 4px solid ${e};`:"",a=e?`background: linear-gradient(135deg, ${e}18 0%, transparent 60%);`:"",i=`node-type-${t.type||"text"}`,s=t.type==="group"?"node-group":"",r="";t.type==="file"&&t.file?r=`<em class="file-ref">[Datei: ${t.file}${t.subpath?" > "+t.subpath:""}]</em>`:t.type==="link"&&t.url?r=`<a href="${t.url}" target="_blank" rel="noopener noreferrer" class="external-link">${t.url}</a>
               <iframe src="${t.url}" sandbox="allow-scripts allow-same-origin allow-same-origin" loading="lazy" class="link-iframe"></iframe>`:t.type==="image"&&t.file?r=`<img src="${t.file}" alt="Bild" style="max-width:100%;height:auto;border-radius:6px;">`:r=T(t.text??"");let c=t.label?`<div class="node-title">${u(t.label)}</div>`:"",o=t.type==="group"?`min-height: ${t.height}px;`:`min-height: ${Math.max(t.height,80)}px;`;return`<div class="node ${i} ${s}"
     id="n-${t.id}"
     data-node-id="${t.id}"
     style="left:${t.x.toFixed(1)}px;top:${t.y.toFixed(1)}px;
            width:${t.width}px;${o}
            ${n}${a}">
    ${c}
    <div class="node-content">${r}</div>
</div>`}function B(t,e,n,a){if(t.length===0)return"";let i=[],s=[],r=[];for(let o of t){let l=e.get(o.fromNode),g=e.get(o.toNode);if(!l||!g)continue;let p=S(l,o.fromSide),h=S(g,o.toSide),f=H(p,h,o.fromSide,o.toSide),m=M(o.color)||"var(--edge-color)",x="",k="",C=`arrow-${o.id}-start`,E=`arrow-${o.id}-end`;if(o.fromEnd==="arrow"&&(i.push(`<marker id="${C}" markerWidth="12" markerHeight="8" refX="1" refY="4" orient="auto"><polygon points="12 0, 0 4, 12 8" fill="${m}"/></marker>`),x=`marker-start="url(#${C})"`),o.toEnd==="arrow"&&(i.push(`<marker id="${E}" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto"><polygon points="0 0, 12 4, 0 8" fill="${m}"/></marker>`),k=`marker-end="url(#${E})"`),s.push(`<path d="${f}" stroke="${m}" stroke-width="2" fill="none" stroke-linecap="round" ${x} ${k}/>`),o.label){let D=(p.x+h.x)/2,P=(p.y+h.y)/2;r.push(`<div class="edge-label" style="left:${D.toFixed(1)}px;top:${P.toFixed(1)}px;">${u(o.label)}</div>`)}}let c=i.length>0?`<defs>${i.join("")}</defs>`:"";return`<svg class="edges-layer" width="${n}" height="${a}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:5;">${c}${s.join("")}</svg>${r.join("")}`}function R(t,e={}){let n=e.darkMode!==!1,a=e.title||t.name||"Canvas Export",i=A(t),s=new Map(t.nodes.map(h=>[h.id,h])),r=t.nodes.length,c=t.edges.length,o=t.nodes.map(h=>O(h)).join(`
`),l=B(t.edges,s,i.width,i.height),g=`
:root {
  --bg:            ${n?"#1a1a2e":"#f0f0f0"};
  --surface:       ${n?"#16213e":"#ffffff"};
  --surface-hover:${n?"#1a2744":"#f8f8ff"};
  --border:        ${n?"#2a3a5c":"#d0d0d0"};
  --text:          ${n?"#e0e0e0":"#333333"};
  --text-muted:    ${n?"#8899aa":"#888888"};
  --title:         ${n?"#ffffff":"#111111"};
  --accent:        #4da6ff;
  --accent-hover:  #66b8ff;
  --edge-color:    ${n?"#5588bb":"#888888"};
  --group-bg:      ${n?"rgba(100,140,200,0.08)":"rgba(100,140,200,0.06)"};
  --group-border:  ${n?"#3a5a8a":"#aabbcc"};
  --shadow:        ${n?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.15)"};
  --code-bg:       ${n?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"};
  --mark-bg:       ${n?"rgba(255,255,0,0.25)":"rgba(255,255,0,0.4)"};
  --minimap-bg:    ${n?"rgba(0,0,0,0.6)":"rgba(255,255,255,0.85)"};
}

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  height: 100vh;
  user-select: none;
}

#viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: grab;
}
#viewport.grabbing { cursor: grabbing; }
#world {
  position: absolute;
  transform-origin: 0 0;
  will-change: transform;
}

.canvas-page {
  position: relative;
  width: ${i.width}px;
  height: ${i.height}px;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 49px,
    ${n?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"} 50px
  ),
  repeating-linear-gradient(
    90deg, transparent, transparent 49px,
    ${n?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"} 50px
  );
}

.node {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 12px var(--shadow);
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: auto;
  font-size: 14px;
  line-height: 1.6;
  z-index: 10;
  cursor: move;
  transition: box-shadow 0.2s, transform 0.15s;
}
.node:hover {
  box-shadow: 0 6px 24px var(--shadow);
  z-index: 100;
}
.node.dragging {
  opacity: 0.85;
  z-index: 999;
  box-shadow: 0 12px 40px var(--shadow);
}
.node-group {
  background: var(--group-bg);
  border: 2px dashed var(--group-border);
  z-index: 1;
  cursor: default;
}
.node-type-link iframe {
  width: 100%;
  height: 200px;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-top: 8px;
}
.node-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--title);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.node-content { color: var(--text); }
.node-content h1 { font-size: 1.4em; margin: 10px 0 5px; color: var(--title); }
.node-content h2 { font-size: 1.2em; margin: 8px 0 4px;  color: var(--title); }
.node-content h3 { font-size: 1.05em; margin: 6px 0 3px;  color: var(--title); }
.node-content p  { margin: 6px 0; }
.node-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
.node-content a  { color: var(--accent); text-decoration: none; }
.node-content a:hover { text-decoration: underline; color: var(--accent-hover); }
.node-content code {
  background: var(--code-bg);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 0.88em;
}
.node-content pre {
  background: ${n?"#0d1117":"#f6f8fa"};
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid var(--border);
}
.node-content pre code { background: none; padding: 0; font-size: 0.85em; }
.node-content blockquote {
  border-left: 3px solid var(--accent);
  padding: 4px 12px;
  margin: 8px 0;
  color: var(--text-muted);
  font-style: italic;
}
.node-content ul, .node-content ol { margin: 4px 0 4px 20px; }
.node-content li { margin: 2px 0; }
.node-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
.node-content th, .node-content td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
  font-size: 0.9em;
}
.node-content th { background: var(--code-bg); font-weight: 600; }
.node-content hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
.node-content mark { background: var(--mark-bg); padding: 1px 3px; border-radius: 2px; }
.node-content .tag {
  background: var(--accent);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: 500;
}
.node-content .checklist { list-style: none; margin-left: 0; }
.node-content .task-item { display: flex; align-items: center; gap: 6px; }
.node-content .task-item input { margin: 0; }
.node-content .footnote-ref { color: var(--accent); cursor: pointer; }
.node-content .file-ref {
  font-size: 0.85em;
  color: var(--text-muted);
  font-style: italic;
}
.node-content .external-link {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.node-content .link-iframe { display: none; }
.node-content .link-iframe.visible { display: block; }

.edge-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 6;
  pointer-events: none;
  white-space: nowrap;
}

.controls {
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2000;
}
.controls button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  width: 38px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.controls button:hover { background: var(--surface-hover); }

.search-bar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  gap: 0;
}
.search-bar input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-right: none;
  color: var(--text);
  padding: 8px 14px;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  width: 260px;
  outline: none;
}
.search-bar input:focus { border-color: var(--accent); }
.search-bar button {
  background: var(--accent);
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 14px;
}

.node.search-highlight {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  animation: pulse 1s ease-in-out 2;
}
@keyframes pulse {
  0%, 100% { outline-color: var(--accent); }
  50% { outline-color: transparent; }
}

.theme-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 2000;
}
.theme-toggle button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.info-badge {
  position: fixed;
  bottom: 12px;
  left: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 2000;
}

.minimap {
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 200px;
  height: 150px;
  background: var(--minimap-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  z-index: 2000;
  cursor: pointer;
}
.minimap canvas { width: 100%; height: 100%; }
  `,p=`
(function() {
  "use strict";

  let scale = 1, panX = 0, panY = 0;
  let isPanning = false, isDragging = false;
  let panSX = 0, panSY = 0;
  let dragNode = null, dragOffX = 0, dragOffY = 0;
  let isDark = ${n};
  let searchIdx = 0, searchMatches = [];

  const vp  = document.getElementById("viewport");
  const wld = document.getElementById("world");
  const pageEl = document.querySelector(".canvas-page");
  const minimapEl = document.querySelector(".minimap");

  function apply() {
    wld.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
    updateMinimap();
  }

  // \u2500\u2500 Zoom per Mausrad \u2500\u2500
  vp.addEventListener("wheel", function(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const r = (scale + delta) / scale;
    scale = Math.min(5, Math.max(0.05, scale + delta));
    panX = e.clientX - (e.clientX - panX) * r;
    panY = e.clientY - (e.clientY - panY) * r;
    apply();
  }, { passive: false });

  // \u2500\u2500 Pan per Drag auf den Hintergrund \u2500\u2500
  vp.addEventListener("pointerdown", function(e) {
    if (e.target.closest(".node") && !e.target.closest(".node-group")) return;
    isPanning = true;
    panSX = e.clientX - panX;
    panSY = e.clientY - panY;
    vp.classList.add("grabbing");
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener("pointermove", function(e) {
    if (!isPanning) return;
    panX = e.clientX - panSX;
    panY = e.clientY - panSY;
    apply();
  });

  vp.addEventListener("pointerup", function() {
    isPanning = false;
    vp.classList.remove("grabbing");
  });

  // \u2500\u2500 Node Drag \u2500\u2500
  document.querySelectorAll(".node:not(.node-group)").forEach(function(node) {
    node.addEventListener("pointerdown", function(e) {
      if (e.target.closest("a") || e.target.closest("input")) return;
      e.stopPropagation();
      isDragging = true;
      dragNode = node;
      dragNode.classList.add("dragging");
      const rect = node.getBoundingClientRect();
      dragOffX = (e.clientX - rect.left) / scale;
      dragOffY = (e.clientY - rect.top) / scale;
      vp.setPointerCapture(e.pointerId);
    });
  });

  vp.addEventListener("pointermove", function(e) {
    if (!isDragging || !dragNode) return;
    const nx = (e.clientX / scale) - panX / scale - dragOffX;
    const ny = (e.clientY / scale) - panY / scale - dragOffY;
    dragNode.style.left = nx.toFixed(1) + "px";
    dragNode.style.top  = ny.toFixed(1) + "px";
    updateEdges();
    updateMinimap();
  });

  vp.addEventListener("pointerup", function() {
    if (dragNode) dragNode.classList.remove("dragging");
    isDragging = false;
    dragNode = null;
  });

  // \u2500\u2500 Kanten-Updates nach Drag \u2500\u2500
  function updateEdges() {
    document.querySelectorAll(".node").forEach(function(n) {
      var id = n.dataset.nodeId;
      if (!id) return;
    });
  }

  // \u2500\u2500 Zoom-Buttons \u2500\u2500
  window.zoomIn  = function() { zoomAt(vp.clientWidth / 2, vp.clientHeight / 2,  0.15); };
  window.zoomOut = function() { zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, -0.15); };
  window.resetView = function() {
    scale = 1; panX = 0; panY = 0;
    apply();
  };

  function zoomAt(cx, cy, delta) {
    var old = scale;
    scale = Math.min(5, Math.max(0.05, scale + delta));
    var r = scale / old;
    panX = cx - (cx - panX) * r;
    panY = cy - (cy - panY) * r;
    apply();
  }

  // \u2500\u2500 Suche \u2500\u2500
  window.doSearch = function() {
    var term = document.getElementById("search-input").value.trim();
    if (!term) return;

    document.querySelectorAll(".node").forEach(function(n) {
      n.classList.remove("search-highlight");
    });

    var hits = document.evaluate(
      ".//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'" +
      term.toLowerCase() + "')]",
      pageEl, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );

    searchMatches = [];
    var seen = new Set();
    for (var i = 0; i < hits.snapshotLength; i++) {
      var node = hits.snapshotItem(i).closest(".node");
      if (node && !seen.has(node)) {
        seen.add(node);
        node.classList.add("search-highlight");
        searchMatches.push(node);
      }
    }

    if (searchMatches.length > 0) {
      searchIdx = 0;
      scrollToMatch();
      new Notice(term + ": " + searchMatches.length + " Treffer", 2000);
    } else {
      new Notice("Keine Treffer f\xFCr: " + term, 2000);
    }
  };

  window.nextSearch = function() {
    if (!searchMatches.length) return;
    searchIdx = (searchIdx + 1) % searchMatches.length;
    scrollToMatch();
  };

  function scrollToMatch() {
    if (!searchMatches[searchIdx]) return;
    var el = searchMatches[searchIdx];
    var r = el.getBoundingClientRect();
    panX = vp.clientWidth  / 2 - (r.left + r.width  / 2);
    panY = vp.clientHeight / 2 - (r.top  + r.height / 2);
    apply();
  }

  // \u2500\u2500 Theme-Toggle \u2500\u2500
  window.toggleTheme = function() {
    isDark = !isDark;
    var root = document.documentElement;
    if (isDark) {
      root.style.setProperty("--bg",            "#1a1a2e");
      root.style.setProperty("--surface",       "#16213e");
      root.style.setProperty("--surface-hover",  "#1a2744");
      root.style.setProperty("--border",         "#2a3a5c");
      root.style.setProperty("--text",           "#e0e0e0");
      root.style.setProperty("--text-muted",     "#8899aa");
      root.style.setProperty("--title",          "#ffffff");
      root.style.setProperty("--edge-color",     "#5588bb");
    } else {
      root.style.setProperty("--bg",            "#f0f0f0");
      root.style.setProperty("--surface",        "#ffffff");
      root.style.setProperty("--surface-hover",  "#f8f8ff");
      root.style.setProperty("--border",         "#d0d0d0");
      root.style.setProperty("--text",           "#333333");
      root.style.setProperty("--text-muted",     "#888888");
      root.style.setProperty("--title",          "#111111");
      root.style.setProperty("--edge-color",     "#888888");
    }
  };

  // \u2500\u2500 Minimap \u2500\u2500
  function updateMinimap() {
    var mc = document.getElementById("minimap-canvas");
    if (!mc) return;
    var ctx = mc.getContext("2d");
    var pw = pageEl.offsetWidth, ph = pageEl.offsetHeight;
    mc.width = 200; mc.height = Math.round(200 * ph / pw);

    ctx.fillStyle = isDark ? "#0d1117" : "#ffffff";
    ctx.fillRect(0, 0, mc.width, mc.height);

    document.querySelectorAll(".node").forEach(function(n) {
      var r = n.getBoundingClientRect();
      var vp2 = vp.getBoundingClientRect();
      var nx = (r.left - vp2.left) / scale + panX / scale;
      var ny = (r.top  - vp2.top)  / scale + panY / scale;
      var nw = r.width  / scale;
      var nh = r.height / scale;
      ctx.fillStyle = isDark ? "#4da6ff55" : "#4da6ff44";
      ctx.fillRect(nx, ny, nw, nh);
      ctx.strokeStyle = isDark ? "#4da6ffaa" : "#4da6ff88";
      ctx.strokeRect(nx, ny, nw, nh);
    });

    var vw = vp.clientWidth / scale;
    var vh = vp.clientHeight / scale;
    var vx = -panX / scale;
    var vy = -panY / scale;
    ctx.strokeStyle = "#ff6644";
    ctx.lineWidth = 2;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  minimapEl && minimapEl.addEventListener("click", function(e) {
    var rect = minimapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var pw = pageEl.offsetWidth,  ph = pageEl.offsetHeight;
    var vw = vp.clientWidth / scale, vh = vp.clientHeight / scale;
    panX = -(mx * pw / 200 - vp.clientWidth  / 2) * scale;
    panY = -(my * ph / 200 - vp.clientHeight / 2) * scale;
    apply();
  });

  // \u2500\u2500 Info-Badge \u2500\u2500
  function updateInfo() {
    var badge = document.getElementById("info-badge");
    if (badge) badge.textContent = scale.toFixed(1) + "x";
  }

  // \u2500\u2500 Link-Vorschau Toggle \u2500\u2500
  document.querySelectorAll(".node-type-link").forEach(function(n) {
    var toggle = n.querySelector(".toggle-iframe");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "toggle-iframe";
      toggle.textContent = "Vorschau";
      toggle.style.cssText = "margin-top:8px;font-size:12px;padding:4px 10px;" +
        "background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer;";
      var content = n.querySelector(".node-content");
      if (content) content.appendChild(toggle);
    }
    toggle.addEventListener("click", function() {
      var iframe = n.querySelector("iframe");
      if (iframe) iframe.classList.toggle("visible");
    });
  });

  // \u2500\u2500 Keyboard Shortcuts \u2500\u2500
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".node.search-highlight")
        .forEach(function(n) { n.classList.remove("search-highlight"); });
      searchMatches = [];
    }
    if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var inp = document.getElementById("search-input");
      if (inp) inp.focus();
    }
  });

  apply();
  updateMinimap();
})();
`;return`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${w(a)}</title>
  <style>${g}</style>
</head>
<body>
  <div id="viewport">
    <div id="world">
      <div class="canvas-page">
        ${l}
        ${o}
      </div>
    </div>
  </div>

  <div class="theme-toggle">
    <button onclick="toggleTheme()" title="Dark/Light wechseln">&#9788;</button>
  </div>

  <div class="search-bar">
    <input id="search-input" placeholder="Suchen... (Ctrl+F)"
           onkeydown="if(event.key==='Enter')doSearch()">
    <button onclick="doSearch()">&#128269;</button>
    <button onclick="nextSearch()" title="N\xE4chster Treffer">&#8680;</button>
  </div>

  <div class="controls">
    <button onclick="zoomIn()"      title="Vergr\xF6\xDFern">+</button>
    <button onclick="zoomOut()"     title="Verkleinern">&#8722;</button>
    <button onclick="resetView()"   title="Ansicht zur\xFCcksetzen">&#8634;</button>
  </div>

  <div id="info-badge" class="info-badge">1.0x</div>

  <div class="minimap">
    <canvas id="minimap-canvas"></canvas>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/obsidian@latest/obsidian.min.js"><\/script>
  <script>${p}<\/script>
</body>
</html>`}function v(t,e={}){return R(t,e)}var _={darkMode:!0,outputDir:"Canvas-Exports",exportImages:!0},b=class extends d.Plugin{async onload(){await this.loadSettings(),this.addRibbonIcon("file-down","Canvas \u2192 HTML exportieren",async()=>{await this.exportCurrentCanvas()}),this.addCommand({id:"export-canvas-html",name:"Export: Aktuellen Canvas als HTML speichern",callback:async()=>{await this.exportCurrentCanvas()}}),this.addCommand({id:"export-all-canvases",name:"Export: Alle Canvas-Dateien im Vault als HTML exportieren",callback:async()=>{await this.exportAllCanvases()}}),this.addCommand({id:"preview-canvas-html",name:"Vorschau: Aktuellen Canvas als HTML anzeigen",callback:async()=>{await this.previewCanvasHtml()}}),this.addSettingTab(new $(this.app,this))}onunload(){}async exportCurrentCanvas(){let e=this.app.workspace.getActiveFile();if(!e||e.extension!=="canvas"){new d.Notice("Kein Canvas gefunden. \xD6ffne ein Canvas und versuche es erneut.",4e3);return}try{let n=await this.app.vault.read(e),a=JSON.parse(n),i={darkMode:this.settings.darkMode,title:a.name||e.basename,exportImages:this.settings.exportImages},s=v(a,i);await this.saveHtmlFile(s,e.basename),new d.Notice("Canvas erfolgreich als HTML exportiert!",3e3)}catch(n){new d.Notice(`Export fehlgeschlagen: ${n}`,5e3)}}async exportAllCanvases(){let e=this.settings.outputDir||"Canvas-Exports",n=this.app.vault,a=0,i=[],s=n.getFiles();for(let r of s)if(r.extension==="canvas")try{let c=await n.read(r),o=JSON.parse(c),l={darkMode:this.settings.darkMode,title:o.name||r.basename,exportImages:this.settings.exportImages},g=v(o,l),p=`${e}/${r.basename}.html`;n.getAbstractFileByPath(e)||await n.createFolder(e);let f=n.getAbstractFileByPath(p);f&&f instanceof d.TFile?await n.modify(f,g):await n.create(p,g),a++}catch{i.push(r.basename)}a>0&&new d.Notice(`${a} Canvas-Dateien exportiert!`,3e3),i.length>0&&new d.Notice(`${i.length} Dateien fehlgeschlagen: ${i.join(", ")}`,5e3)}async previewCanvasHtml(){let e=this.app.workspace.getActiveFile();if(!e||e.extension!=="canvas"){new d.Notice("Kein Canvas gefunden.",4e3);return}try{let n=await this.app.vault.read(e),a=JSON.parse(n),i={darkMode:this.settings.darkMode,title:a.name||e.basename,exportImages:this.settings.exportImages},s=v(a,i),r=`.canvas-preview-${Date.now()}.html`;await this.app.vault.create(r,s),new d.Notice("Vorschau-Datei erstellt: "+r,3e3)}catch(n){new d.Notice(`Vorschau fehlgeschlagen: ${n}`,5e3)}}async saveHtmlFile(e,n){let a=this.settings.outputDir||"Canvas-Exports",i=`${n}.html`,s=`${a}/${i}`;this.app.vault.getAbstractFileByPath(a)||await this.app.vault.createFolder(a);let c=this.app.vault.getAbstractFileByPath(s);c&&c instanceof d.TFile?await this.app.vault.modify(c,e):await this.app.vault.create(s,e)}async loadSettings(){this.settings=Object.assign({},_,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}},$=class extends d.PluginSettingTab{constructor(e,n){super(e,n),this.plugin=n}display(){let{containerEl:e}=this;e.empty(),e.createEl("h2",{text:"Canvas to HTML \u2014 Einstellungen"}),new d.Setting(e).setName("Dark Mode").setDesc("Standardm\xE4\xDFig dunklen Modus verwenden").addToggle(n=>n.setValue(this.plugin.settings.darkMode).onChange(async a=>{this.plugin.settings.darkMode=a,await this.plugin.saveSettings()})),new d.Setting(e).setName("Ausgabeordner").setDesc("Relativer Pfad im Vault (Standard: Canvas-Exports)").addText(n=>n.setValue(this.plugin.settings.outputDir).onChange(async a=>{this.plugin.settings.outputDir=a||"Canvas-Exports",await this.plugin.saveSettings()})),new d.Setting(e).setName("Bilder einbetten").setDesc("Referenzierte Bilder als Base64 in die HTML einbetten").addToggle(n=>n.setValue(this.plugin.settings.exportImages).onChange(async a=>{this.plugin.settings.exportImages=a,await this.plugin.saveSettings()}))}};
