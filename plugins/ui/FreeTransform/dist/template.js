this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};

this["joint"]["templates"]["freetransform.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"resize\" data-position=\"top-left\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"top\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"top-right\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"right\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"bottom-right\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"bottom\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"bottom-left\" draggable=\"false\"/>\n<div class=\"resize\" data-position=\"left\" draggable=\"false\"/>\n<div class=\"rotate\" draggable=\"false\"/>\n\n";
  });