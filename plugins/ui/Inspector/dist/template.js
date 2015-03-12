this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["inspector"] = this["joint"]["templates"]["inspector"] || {};

this["joint"]["templates"]["inspector"]["color.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<input type=\"color\" class=\"color\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["group.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"group\">\n    <h3 class=\"group-label\">";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n</div>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["list-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"list-item\" data-index=\"";
  if (stack1 = helpers.index) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.index; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n    <button class=\"btn-list-del\">-</button>\n</div>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["list.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<div class=\"list\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n    <button class=\"btn-list-add\">+</button>\n    <div class=\"list-items\">\n    </div>\n</div>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["number.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<input type=\"number\" class=\"number\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" min=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.min)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" max=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.max)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" step=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.step)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" value=\"";
  if (stack2 = helpers.value) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.value; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\"/>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["object-property.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"object-property\" data-property=\"";
  if (stack1 = helpers.property) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.property; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n</div>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["object.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<div class=\"object\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n    <div class=\"object-properties\"></div>\n</div>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["range.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<form onchange=\"$(this).find('output').text(range.value)\">\n    <label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ": (<output>";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</output>"
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.unit)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</label>\n    <input type=\"range\" class=\"range\" name=\"range\" data-type=\"";
  if (stack2 = helpers.type) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.type; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" data-attribute=\"";
  if (stack2 = helpers.attribute) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.attribute; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" min=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.min)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" max=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.max)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" step=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.step)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" value=\"";
  if (stack2 = helpers.value) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.value; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\"/>\n</form>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["select.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += " multiple size=\""
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.options)),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  return buffer;
  }

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <option value=\""
    + escapeExpression(((stack1 = depth0.value),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  stack2 = ((stack1 = helpers['is-or-contains'] || depth0['is-or-contains']),stack1 ? stack1.call(depth0, depth0.value, depth1.value, options) : helperMissing.call(depth0, "is-or-contains", depth0.value, depth1.value, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">"
    + escapeExpression(((stack1 = depth0.content),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n    ";
  return buffer;
  }
function program4(depth0,data) {
  
  
  return " selected ";
  }

  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<select class=\"select\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" ";
  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.multiple), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">\n    ";
  stack2 = helpers.each.call(depth0, ((stack1 = depth0.options),stack1 == null || stack1 === false ? stack1 : stack1.items), {hash:{},inverse:self.noop,fn:self.programWithDepth(3, program3, data, depth0),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</select>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["text.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<input type=\"text\" class=\"text\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["textarea.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<textarea class=\"textarea\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n";
  return buffer;
  });

this["joint"]["templates"]["inspector"]["toggle.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return " checked ";
  }

  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</label>\n<div class=\"toggle\">\n    <input type=\"checkbox\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-attribute=\"";
  if (stack1 = helpers.attribute) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.attribute; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" ";
  stack1 = helpers['if'].call(depth0, depth0.value, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " />\n    <span><i></i></span>\n</div>\n";
  return buffer;
  });