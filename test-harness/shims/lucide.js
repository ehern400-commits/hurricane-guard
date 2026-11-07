// Test-only stand-in for lucide-react: renders a simple SVG with the icon name.
import React from "react";
export default new Proxy({}, { get: (_, name) => make(name) });
function make(name) {
  return function Icon({ size = 24, className = "", style, ...rest }) {
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", className, style, "data-icon": name, "aria-hidden": rest["aria-hidden"] },
      React.createElement("circle", { cx: 12, cy: 12, r: 9, fill: "none", stroke: "currentColor", strokeWidth: 2 }));
  };
}
