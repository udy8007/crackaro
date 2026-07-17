import fs from "fs";

const files = [
  "client/src/components/sections/Hero.jsx",
  "client/src/components/sections/Trust.jsx",
  "client/src/components/sections/About.jsx",
  "client/src/components/sections/Safety.jsx",
  "client/src/components/sections/Testimonials.jsx",
];

const map = {
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",
  "clip-path": "clipPath",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
  "text-anchor": "textAnchor",
  "xlink:href": "xlinkHref",
  "xml:space": "xmlSpace",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  autocomplete: "autoComplete",
};

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  for (const [from, to] of Object.entries(map)) {
    src = src.replaceAll(`${from}=`, `${to}=`);
  }
  // boolean attributes that may appear alone — none expected
  fs.writeFileSync(file, src);
  console.log("fixed", file);
}
