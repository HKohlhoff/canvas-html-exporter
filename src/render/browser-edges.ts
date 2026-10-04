// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserEdges(): string {
  return `      function setCssProps(element, props) {
        if (!element) return;
        const declarations = Object.entries(props)
          .map(([name, value]) => name + ": " + value + ";")
          .join(" ");
        element.setAttribute("style", (element.getAttribute("style") || "") + " " + declarations);
      }

      function clearChildren(element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      }

      function resolveEdgeColor(color) {
        const normalized = String(color || "").trim();
        if (!normalized) return edgeColor;
        if (obsidianColors[normalized]) return obsidianColors[normalized];
        if (normalized.startsWith("#")) return normalized;
        return edgeColor;
      }

      function getAnchor(el, side) {
        const left = parseFloat(el.getAttribute("data-canvas-left") || "0");
        const top = parseFloat(el.getAttribute("data-canvas-top") || "0");
        const width = el.offsetWidth;
        const height = el.offsetHeight;

        switch (side) {
          case "top": return { x: left + width / 2, y: top };
          case "bottom": return { x: left + width / 2, y: top + height };
          case "left": return { x: left, y: top + height / 2 };
          case "right": return { x: left + width, y: top + height / 2 };
          default: return { x: left + width / 2, y: top + height / 2 };
        }
      }

      function createMarker(defs, id, type, color) {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", id);
        marker.setAttribute("viewBox", "0 0 12 12");
        marker.setAttribute("markerWidth", "12");
        marker.setAttribute("markerHeight", "12");
        marker.setAttribute("refX", type === "bar" ? "6" : "10");
        marker.setAttribute("refY", "6");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        if (type === "circle" || type === "circle-outline") {
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", "6");
          circle.setAttribute("cy", "6");
          circle.setAttribute("r", "3.25");
          circle.setAttribute("fill", type === "circle-outline" ? markerBackground : color);
          circle.setAttribute("stroke", color);
          if (type === "circle-outline") circle.setAttribute("stroke-width", "1.5");
          marker.appendChild(circle);
        } else if (type === "diamond" || type === "diamond-outline") {
          const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          diamond.setAttribute("points", "1 6, 6 1, 11 6, 6 11");
          diamond.setAttribute("fill", type === "diamond-outline" ? markerBackground : color);
          diamond.setAttribute("stroke", color);
          if (type === "diamond-outline") diamond.setAttribute("stroke-width", "1.5");
          marker.appendChild(diamond);
        } else if (type === "square") {
          const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          square.setAttribute("x", "2");
          square.setAttribute("y", "2");
          square.setAttribute("width", "8");
          square.setAttribute("height", "8");
          square.setAttribute("fill", color);
          marker.appendChild(square);
        } else if (type === "bar" || type === "blunt") {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
          line.setAttribute("d", type === "blunt" ? "M 10 1 L 10 11" : "M 6 1 L 6 11");
          line.setAttribute("stroke", color);
          line.setAttribute("stroke-width", type === "blunt" ? "3" : "2");
          line.setAttribute("fill", "none");
          marker.appendChild(line);
        } else if (type === "triangle-outline" || type === "thin-triangle") {
          const triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
          triangle.setAttribute(
            "d",
            type === "thin-triangle"
              ? "M 2 1 L 11 6 L 2 11"
              : "M 2 1 L 11 6 L 2 11 Z",
          );
          triangle.setAttribute(
            "fill",
            type === "triangle-outline" ? markerBackground : "none",
          );
          triangle.setAttribute("stroke", color);
          triangle.setAttribute("stroke-width", type === "thin-triangle" ? "1.75" : "1.5");
          marker.appendChild(triangle);
        } else {
          const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          polygon.setAttribute(
            "points",
            type === "halved-triangle"
              ? "2 6, 11 6, 2 11"
              : "2 1, 11 6, 2 11",
          );
          polygon.setAttribute("fill", color);
          marker.appendChild(polygon);
        }
        defs.appendChild(marker);
      }

      function markerIdFor(color, type) {
        return "marker-" + type + "-" + color.replace(/[^a-zA-Z0-9]/g, "_");
      }

      function dashArrayFor(style, width) {
        const stroke = Math.max(1, Number(width) || 2);
        if (style === "dotted") return stroke + " " + (stroke * 3);
        if (style === "short-dash") return (stroke * 3) + " " + (stroke * 3);
        if (style === "long-dash") return (stroke * 9) + " " + (stroke * 4);
        if (style === "dashed") return (stroke * 6) + " " + (stroke * 4);
        if (style === "dash-dot") return (stroke * 6) + " " + (stroke * 3) + " " + stroke + " " + (stroke * 3);
        return "";
      }

      function drawEdges() {
        syncAdvancedGroupGeometry();
        clearChildren(edgeLayer);
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        edgeLayer.appendChild(defs);
        const seenMarkers = new Set();

        for (const edge of edges) {
          if (
            hiddenEdgeIds.has(edge.id)
            || hiddenNodeIds.has(edge.fromId)
            || hiddenNodeIds.has(edge.toId)
          ) continue;
          const fromEl = document.getElementById("node-" + edge.fromId);
          const toEl = document.getElementById("node-" + edge.toId);
          if (!fromEl || !toEl) continue;

          const start = getAnchor(fromEl, edge.fromSide);
          const end = getAnchor(toEl, edge.toSide);
          const dx = Math.max(Math.abs(end.x - start.x) * 0.35, 28);
          const dy = Math.max(Math.abs(end.y - start.y) * 0.35, 28);
          let c1x = start.x;
          let c1y = start.y;
          let c2x = end.x;
          let c2y = end.y;

          if (edge.fromSide === "right") c1x += dx;
          if (edge.fromSide === "left") c1x -= dx;
          if (edge.fromSide === "top") c1y -= dy;
          if (edge.fromSide === "bottom") c1y += dy;
          if (edge.toSide === "right") c2x += dx;
          if (edge.toSide === "left") c2x -= dx;
          if (edge.toSide === "top") c2y -= dy;
          if (edge.toSide === "bottom") c2y += dy;

          const color = resolveEdgeColor(edge.color);
          const strokeWidth = Math.max(1, Number(edge.width) || 2);
          const dashArray = dashArrayFor(edge.lineStyle, strokeWidth);
          const focusMuted = focusMutedNodeIds.has(edge.fromId)
            || focusMutedNodeIds.has(edge.toId);

          if (edge.fromEnd && edge.fromEnd !== "none") {
            const startMarkerId = markerIdFor(color, edge.fromEnd);
            if (!seenMarkers.has(startMarkerId)) {
              createMarker(defs, startMarkerId, edge.fromEnd, color);
              seenMarkers.add(startMarkerId);
            }
          }

          if (edge.toEnd && edge.toEnd !== "none") {
            const endMarkerId = markerIdFor(color, edge.toEnd);
            if (!seenMarkers.has(endMarkerId)) {
              createMarker(defs, endMarkerId, edge.toEnd, color);
              seenMarkers.add(endMarkerId);
            }
          }

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", "M " + start.x + " " + start.y + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + end.x + " " + end.y);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", color);
          path.setAttribute("stroke-width", String(strokeWidth));
          if (focusMuted) path.setAttribute("opacity", "0.2");
          if (dashArray) {
            path.setAttribute("stroke-dasharray", dashArray);
          }
          if (edge.fromEnd && edge.fromEnd !== "none") {
            path.setAttribute("marker-start", "url(#" + markerIdFor(color, edge.fromEnd) + ")");
          }
          if (edge.toEnd && edge.toEnd !== "none") {
            path.setAttribute("marker-end", "url(#" + markerIdFor(color, edge.toEnd) + ")");
          }
          edgeLayer.appendChild(path);

          if (edge.label) {
            const labelPoint = cubicPoint(start, { x: c1x, y: c1y }, { x: c2x, y: c2y }, end, 0.5);
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", String(labelPoint.x));
            label.setAttribute("y", String(labelPoint.y - 8));
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("class", "edge-label");
            label.setAttribute("fill", textColor);
            if (focusMuted) label.setAttribute("opacity", "0.2");
            label.textContent = edge.label;
            edgeLayer.appendChild(label);

            const bbox = label.getBBox();
            const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bg.setAttribute("x", String(bbox.x - 6));
            bg.setAttribute("y", String(bbox.y - 3));
            bg.setAttribute("width", String(bbox.width + 12));
            bg.setAttribute("height", String(bbox.height + 6));
            bg.setAttribute("rx", "6");
            bg.setAttribute("ry", "6");
            bg.setAttribute("class", "edge-label-background");
            if (focusMuted) bg.setAttribute("opacity", "0.2");
            edgeLayer.insertBefore(bg, label);
          }
        }
      }

      function cubicPoint(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        return {
          x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
          y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
        };
      }

`;
}
