

import * as Caml_option from "./caml_option.js";

function get(dict, k) {
  if ((k in dict)) {
    return Caml_option.some(dict[k]);
  }
  
}

var unsafeDeleteKey = (function (dict,key){
      delete dict[key];
     });

function entries(dict) {
  var keys = Object.keys(dict);
  var l = keys.length;
  var values = new Array(l);
  for(var i = 0; i < l; ++i){
    var key = keys[i];
    values[i] = [
      key,
      dict[key]
    ];
  }
  return values;
}

function values$1(dict) {
  var keys = Object.keys(dict);
  var l = keys.length;
  var values$2 = new Array(l);
  for(var i = 0; i < l; ++i){
    values$2[i] = dict[keys[i]];
  }
  return values$2;
}

function fromList(entries) {
  var dict = {};
  var _param = entries;
  while(true) {
    var param = _param;
    if (!param) {
      return dict;
    }
    var match = param.hd;
    dict[match[0]] = match[1];
    _param = param.tl;
    continue ;
  };
}

function fromArray(entries) {
  var dict = {};
  var l = entries.length;
  for(var i = 0; i < l; ++i){
    var match = entries[i];
    dict[match[0]] = match[1];
  }
  return dict;
}

function map(f, source) {
  var target = {};
  var keys = Object.keys(source);
  var l = keys.length;
  for(var i = 0; i < l; ++i){
    var key = keys[i];
    target[key] = f(source[key]);
  }
  return target;
}

export {
  get ,
  unsafeDeleteKey ,
  entries ,
  values$1 as values,
  fromList ,
  fromArray ,
  map ,
  
}
/* No side effect */
