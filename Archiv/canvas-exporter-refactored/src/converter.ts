// refactored converter.ts
type CanvasNode = any;
type CanvasEdge = any;

export async function convertCanvasToHtml(data: any): Promise<string> {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];

  const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));

  const nodesHtml = (await Promise.all(nodes.map((n: any)=>renderNode(n)))).join("\n");
  const edgesHtml = edges.map((e:any)=>renderEdge(e, nodeMap)).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
.canvas-node{position:absolute;border:1px solid #888;padding:4px;background:#fff;}
.canvas-image-node img{max-width:100%;max-height:100%;}
</style>
</head>
<body>
<div class="canvas-root">
${nodesHtml}
<svg>${edgesHtml}</svg>
</div>
</body>
</html>`;
}

async function renderNode(node:any){
  switch(node.type){
    case "text": return renderTextNode(node);
    case "file": return renderFileNode(node);
    case "link": return renderLinkNode(node);
    case "group": return renderGroupNode(node);
    default: return "";
  }
}

function renderTextNode(n:any){
  return `<div class="canvas-node" style="left:${n.x}px;top:${n.y}px;width:${n.width||200}px;height:${n.height||100}px;">
${(n.text||"").replace(/\n/g,"<br>")}
</div>`;
}

function renderLinkNode(n:any){
  return `<div class="canvas-node" style="left:${n.x}px;top:${n.y}px;">
<a href="${n.url}" target="_blank">${n.url}</a></div>`;
}

function renderGroupNode(n:any){
  return `<div class="canvas-node" style="left:${n.x}px;top:${n.y}px;border:2px dashed #aaa;">
${n.label||""}</div>`;
}

async function renderFileNode(n:any){
  const file = n.file||"";
  const ext = file.split(".").pop()?.toLowerCase();
  if(["png","jpg","jpeg","gif","webp"].includes(ext)){
    return `<div class="canvas-node canvas-image-node" style="left:${n.x}px;top:${n.y}px;">
<img src="${file}"/></div>`;
  }
  return `<div class="canvas-node" style="left:${n.x}px;top:${n.y}px;">
<a href="${file}" target="_blank">${file}</a></div>`;
}

function renderEdge(e:any, map:Map<string,any>){
  const a = map.get(e.fromNode);
  const b = map.get(e.toNode);
  if(!a||!b) return "";
  const x1=a.x+(a.width||100)/2;
  const y1=a.y+(a.height||50)/2;
  const x2=b.x+(b.width||100)/2;
  const y2=b.y+(b.height||50)/2;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black"/>`;
}
