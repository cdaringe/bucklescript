'use strict';

var Curry = require("./curry.js");
var Printexc = require("./printexc.js");
var Caml_exceptions = require("./caml_exceptions.js");
var Caml_js_exceptions = require("./caml_js_exceptions.js");
var Caml_external_polyfill = require("./caml_external_polyfill.js");

function $$const(c, param) {
  return c;
}

function flip(f, x, y) {
  return Curry._2(f, y, x);
}

function negate(p, v) {
  return !Curry._1(p, v);
}

var Finally_raised = /* @__PURE__ */Caml_exceptions.create("Fun.Finally_raised");

Printexc.register_printer(function (exn) {
      if (exn.RE_EXN_ID === Finally_raised) {
        return "Fun.Finally_raised: " + Printexc.to_string(exn._1);
      }
      
    });

function protect($$finally, work) {
  var finally_no_exn = function (param) {
    try {
      return Curry._1($$finally, undefined);
    }
    catch (raw_e){
      var e = Caml_js_exceptions.internalToOCamlException(raw_e);
      var bt;
      var exn = {
        RE_EXN_ID: Finally_raised,
        _1: e
      };
      Caml_external_polyfill.resolve("caml_restore_raw_backtrace")(exn, bt);
      throw exn;
    }
  };
  try {
    var result = Curry._1(work, undefined);
    finally_no_exn(undefined);
    return result;
  }
  catch (raw_work_exn){
    var work_exn = Caml_js_exceptions.internalToOCamlException(raw_work_exn);
    var work_bt;
    finally_no_exn(undefined);
    Caml_external_polyfill.resolve("caml_restore_raw_backtrace")(work_exn, work_bt);
    throw work_exn;
  }
}

exports.$$const = $$const;
exports.flip = flip;
exports.negate = negate;
exports.protect = protect;
exports.Finally_raised = Finally_raised;
/*  Not a pure module */
