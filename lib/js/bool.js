'use strict';

var Caml_primitive = require("./caml_primitive.js");

function equal(prim, prim$1) {
  return prim === prim$1;
}

var compare = Caml_primitive.caml_int_compare;

function to_float(param) {
  if (param) {
    return 1;
  } else {
    return 0;
  }
}

function to_string(param) {
  if (param) {
    return "true";
  } else {
    return "false";
  }
}

function not(prim) {
  return !prim;
}

function to_int(prim) {
  return prim;
}

exports.not = not;
exports.equal = equal;
exports.compare = compare;
exports.to_int = to_int;
exports.to_float = to_float;
exports.to_string = to_string;
/* No side effect */
