'use strict';

var Char = require("./char.js");
var $$String = require("./string.js");
var Caml_md5 = require("./caml_md5.js");
var Caml_bytes = require("./caml_bytes.js");
var Caml_string = require("./caml_string.js");
var Stdlib__no_aliases = require("./stdlib__no_aliases.js");
var Caml_external_polyfill = require("./caml_external_polyfill.js");

function string(str) {
  return Caml_md5.caml_md5_string(str, 0, str.length);
}

function bytes(b) {
  return string(Caml_bytes.bytes_to_string(b));
}

function substring(str, ofs, len) {
  if (ofs < 0 || len < 0 || ofs > (str.length - len | 0)) {
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Digest.substring",
          Error: new Error()
        };
  }
  return Caml_md5.caml_md5_string(str, ofs, len);
}

function subbytes(b, ofs, len) {
  return substring(Caml_bytes.bytes_to_string(b), ofs, len);
}

function file(filename) {
  var ic = Stdlib__no_aliases.open_in_bin(filename);
  try {
    var d = Caml_external_polyfill.resolve("caml_md5_chan")(ic, -1);
    Caml_external_polyfill.resolve("caml_ml_close_channel")(ic);
    return d;
  }
  catch (e){
    Caml_external_polyfill.resolve("caml_ml_close_channel")(ic);
    throw e;
  }
}

var output = Stdlib__no_aliases.output_string;

function input(chan) {
  return Stdlib__no_aliases.really_input_string(chan, 16);
}

function char_hex(n) {
  return n + (
          n < 10 ? /* '0' */48 : 87
        ) | 0;
}

function to_hex(d) {
  if (d.length !== 16) {
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Digest.to_hex",
          Error: new Error()
        };
  }
  var result = Caml_bytes.caml_create_bytes(32);
  for(var i = 0; i <= 15; ++i){
    var x = Caml_string.get(d, i);
    result[(i << 1)] = char_hex((x >>> 4));
    result[(i << 1) + 1 | 0] = char_hex(x & 15);
  }
  return Caml_bytes.bytes_to_string(result);
}

function from_hex(s) {
  if (s.length !== 32) {
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Digest.from_hex",
          Error: new Error()
        };
  }
  var digit = function (c) {
    if (c >= 65) {
      if (c >= 97) {
        if (c >= 103) {
          throw {
                RE_EXN_ID: Stdlib__no_aliases.Invalid_argument,
                _1: "Digest.from_hex",
                Error: new Error()
              };
        }
        return (c - /* 'a' */97 | 0) + 10 | 0;
      }
      if (c >= 71) {
        throw {
              RE_EXN_ID: Stdlib__no_aliases.Invalid_argument,
              _1: "Digest.from_hex",
              Error: new Error()
            };
      }
      return (c - /* 'A' */65 | 0) + 10 | 0;
    }
    if (c > 57 || c < 48) {
      throw {
            RE_EXN_ID: Stdlib__no_aliases.Invalid_argument,
            _1: "Digest.from_hex",
            Error: new Error()
          };
    }
    return c - /* '0' */48 | 0;
  };
  var $$byte = function (i) {
    return (digit(Caml_string.get(s, i)) << 4) + digit(Caml_string.get(s, i + 1 | 0)) | 0;
  };
  var result = Caml_bytes.caml_create_bytes(16);
  for(var i = 0; i <= 15; ++i){
    Caml_bytes.set(result, i, Char.chr($$byte((i << 1))));
  }
  return Caml_bytes.bytes_to_string(result);
}

var compare = $$String.compare;

var equal = $$String.equal;

exports.compare = compare;
exports.equal = equal;
exports.string = string;
exports.bytes = bytes;
exports.substring = substring;
exports.subbytes = subbytes;
exports.file = file;
exports.output = output;
exports.input = input;
exports.to_hex = to_hex;
exports.from_hex = from_hex;
/* No side effect */
