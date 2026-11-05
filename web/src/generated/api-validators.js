// SPDX-License-Identifier: AGPL-3.0-or-later
// Generated from Rust wire DTOs. Do not edit.
/*! ajv runtime helpers
The MIT License (MIT)

Copyright (c) 2015-2021 Evgeny Poberezkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

/*! esbuild runtime helpers
MIT License

Copyright (c) 2020 Evan Wallace

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) =>
  function __require() {
    try {
      return (
        mod ||
          (0, cb[__getOwnPropNames(cb)[0]])(
            (mod = { exports: {} }).exports,
            mod,
          ),
        mod.exports
      );
    } catch (e) {
      throw ((mod = 0), e);
    }
  };

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320) pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  },
});

// api-validators.js
var auth = validate169;
var schema7 = {
  type: "object",
  properties: {
    client_id: { type: "string" },
    csrf_token: { type: ["string", "null"] },
  },
  required: ["client_id", "csrf_token"],
};
function validate169(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.client_id === void 0 && (missing0 = "client_id")) ||
        (data.csrf_token === void 0 && (missing0 = "csrf_token"))
      ) {
        validate169.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.client_id !== void 0) {
          const _errs1 = errors;
          if (typeof data.client_id !== "string") {
            validate169.errors = [
              {
                instancePath: instancePath + "/client_id",
                schemaPath: "#/properties/client_id/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.csrf_token !== void 0) {
            let data1 = data.csrf_token;
            const _errs3 = errors;
            if (typeof data1 !== "string" && data1 !== null) {
              validate169.errors = [
                {
                  instancePath: instancePath + "/csrf_token",
                  schemaPath: "#/properties/csrf_token/type",
                  keyword: "type",
                  params: { type: schema7.properties.csrf_token.type },
                  message: "must be string,null",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate169.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate169.errors = vErrors;
  return errors === 0;
}
var capabilities = validate170;
function validate25(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.clock_hz === void 0 && (missing0 = "clock_hz")) ||
        (data.tseg1_min === void 0 && (missing0 = "tseg1_min")) ||
        (data.tseg1_max === void 0 && (missing0 = "tseg1_max")) ||
        (data.tseg2_min === void 0 && (missing0 = "tseg2_min")) ||
        (data.tseg2_max === void 0 && (missing0 = "tseg2_max")) ||
        (data.sjw_max === void 0 && (missing0 = "sjw_max")) ||
        (data.brp_min === void 0 && (missing0 = "brp_min")) ||
        (data.brp_max === void 0 && (missing0 = "brp_max")) ||
        (data.brp_inc === void 0 && (missing0 = "brp_inc"))
      ) {
        validate25.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.brp_inc !== void 0) {
          let data0 = data.brp_inc;
          const _errs1 = errors;
          if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0))) {
            validate25.errors = [
              {
                instancePath: instancePath + "/brp_inc",
                schemaPath: "#/properties/brp_inc/type",
                keyword: "type",
                params: { type: "integer" },
                message: "must be integer",
              },
            ];
            return false;
          }
          if (errors === _errs1) {
            if (typeof data0 == "number") {
              if (data0 < 0 || isNaN(data0)) {
                validate25.errors = [
                  {
                    instancePath: instancePath + "/brp_inc",
                    schemaPath: "#/properties/brp_inc/minimum",
                    keyword: "minimum",
                    params: { comparison: ">=", limit: 0 },
                    message: "must be >= 0",
                  },
                ];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.brp_max !== void 0) {
            let data1 = data.brp_max;
            const _errs3 = errors;
            if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1))) {
              validate25.errors = [
                {
                  instancePath: instancePath + "/brp_max",
                  schemaPath: "#/properties/brp_max/type",
                  keyword: "type",
                  params: { type: "integer" },
                  message: "must be integer",
                },
              ];
              return false;
            }
            if (errors === _errs3) {
              if (typeof data1 == "number") {
                if (data1 < 0 || isNaN(data1)) {
                  validate25.errors = [
                    {
                      instancePath: instancePath + "/brp_max",
                      schemaPath: "#/properties/brp_max/minimum",
                      keyword: "minimum",
                      params: { comparison: ">=", limit: 0 },
                      message: "must be >= 0",
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.brp_min !== void 0) {
              let data2 = data.brp_min;
              const _errs5 = errors;
              if (!(
                typeof data2 == "number" &&
                !(data2 % 1) &&
                !isNaN(data2)
              )) {
                validate25.errors = [
                  {
                    instancePath: instancePath + "/brp_min",
                    schemaPath: "#/properties/brp_min/type",
                    keyword: "type",
                    params: { type: "integer" },
                    message: "must be integer",
                  },
                ];
                return false;
              }
              if (errors === _errs5) {
                if (typeof data2 == "number") {
                  if (data2 < 0 || isNaN(data2)) {
                    validate25.errors = [
                      {
                        instancePath: instancePath + "/brp_min",
                        schemaPath: "#/properties/brp_min/minimum",
                        keyword: "minimum",
                        params: { comparison: ">=", limit: 0 },
                        message: "must be >= 0",
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.clock_hz !== void 0) {
                let data3 = data.clock_hz;
                const _errs7 = errors;
                if (!(
                  typeof data3 == "number" &&
                  !(data3 % 1) &&
                  !isNaN(data3)
                )) {
                  validate25.errors = [
                    {
                      instancePath: instancePath + "/clock_hz",
                      schemaPath: "#/properties/clock_hz/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs7) {
                  if (typeof data3 == "number") {
                    if (data3 < 0 || isNaN(data3)) {
                      validate25.errors = [
                        {
                          instancePath: instancePath + "/clock_hz",
                          schemaPath: "#/properties/clock_hz/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 0 },
                          message: "must be >= 0",
                        },
                      ];
                      return false;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sjw_max !== void 0) {
                  let data4 = data.sjw_max;
                  const _errs9 = errors;
                  if (!(
                    typeof data4 == "number" &&
                    !(data4 % 1) &&
                    !isNaN(data4)
                  )) {
                    validate25.errors = [
                      {
                        instancePath: instancePath + "/sjw_max",
                        schemaPath: "#/properties/sjw_max/type",
                        keyword: "type",
                        params: { type: "integer" },
                        message: "must be integer",
                      },
                    ];
                    return false;
                  }
                  if (errors === _errs9) {
                    if (typeof data4 == "number") {
                      if (data4 < 0 || isNaN(data4)) {
                        validate25.errors = [
                          {
                            instancePath: instancePath + "/sjw_max",
                            schemaPath: "#/properties/sjw_max/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.tseg1_max !== void 0) {
                    let data5 = data.tseg1_max;
                    const _errs11 = errors;
                    if (!(
                      typeof data5 == "number" &&
                      !(data5 % 1) &&
                      !isNaN(data5)
                    )) {
                      validate25.errors = [
                        {
                          instancePath: instancePath + "/tseg1_max",
                          schemaPath: "#/properties/tseg1_max/type",
                          keyword: "type",
                          params: { type: "integer" },
                          message: "must be integer",
                        },
                      ];
                      return false;
                    }
                    if (errors === _errs11) {
                      if (typeof data5 == "number") {
                        if (data5 < 0 || isNaN(data5)) {
                          validate25.errors = [
                            {
                              instancePath: instancePath + "/tseg1_max",
                              schemaPath: "#/properties/tseg1_max/minimum",
                              keyword: "minimum",
                              params: { comparison: ">=", limit: 0 },
                              message: "must be >= 0",
                            },
                          ];
                          return false;
                        }
                      }
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.tseg1_min !== void 0) {
                      let data6 = data.tseg1_min;
                      const _errs13 = errors;
                      if (!(
                        typeof data6 == "number" &&
                        !(data6 % 1) &&
                        !isNaN(data6)
                      )) {
                        validate25.errors = [
                          {
                            instancePath: instancePath + "/tseg1_min",
                            schemaPath: "#/properties/tseg1_min/type",
                            keyword: "type",
                            params: { type: "integer" },
                            message: "must be integer",
                          },
                        ];
                        return false;
                      }
                      if (errors === _errs13) {
                        if (typeof data6 == "number") {
                          if (data6 < 0 || isNaN(data6)) {
                            validate25.errors = [
                              {
                                instancePath: instancePath + "/tseg1_min",
                                schemaPath: "#/properties/tseg1_min/minimum",
                                keyword: "minimum",
                                params: { comparison: ">=", limit: 0 },
                                message: "must be >= 0",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.tseg2_max !== void 0) {
                        let data7 = data.tseg2_max;
                        const _errs15 = errors;
                        if (!(
                          typeof data7 == "number" &&
                          !(data7 % 1) &&
                          !isNaN(data7)
                        )) {
                          validate25.errors = [
                            {
                              instancePath: instancePath + "/tseg2_max",
                              schemaPath: "#/properties/tseg2_max/type",
                              keyword: "type",
                              params: { type: "integer" },
                              message: "must be integer",
                            },
                          ];
                          return false;
                        }
                        if (errors === _errs15) {
                          if (typeof data7 == "number") {
                            if (data7 < 0 || isNaN(data7)) {
                              validate25.errors = [
                                {
                                  instancePath: instancePath + "/tseg2_max",
                                  schemaPath: "#/properties/tseg2_max/minimum",
                                  keyword: "minimum",
                                  params: { comparison: ">=", limit: 0 },
                                  message: "must be >= 0",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.tseg2_min !== void 0) {
                          let data8 = data.tseg2_min;
                          const _errs17 = errors;
                          if (!(
                            typeof data8 == "number" &&
                            !(data8 % 1) &&
                            !isNaN(data8)
                          )) {
                            validate25.errors = [
                              {
                                instancePath: instancePath + "/tseg2_min",
                                schemaPath: "#/properties/tseg2_min/type",
                                keyword: "type",
                                params: { type: "integer" },
                                message: "must be integer",
                              },
                            ];
                            return false;
                          }
                          if (errors === _errs17) {
                            if (typeof data8 == "number") {
                              if (data8 < 0 || isNaN(data8)) {
                                validate25.errors = [
                                  {
                                    instancePath: instancePath + "/tseg2_min",
                                    schemaPath:
                                      "#/properties/tseg2_min/minimum",
                                    keyword: "minimum",
                                    params: { comparison: ">=", limit: 0 },
                                    message: "must be >= 0",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate25.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate25.errors = vErrors;
  return errors === 0;
}
function validate170(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.backend === void 0 && (missing0 = "backend")) ||
        (data.simulated === void 0 && (missing0 = "simulated")) ||
        (data.fd === void 0 && (missing0 = "fd")) ||
        (data.listen_only === void 0 && (missing0 = "listen_only")) ||
        (data.hardware_timestamps === void 0 &&
          (missing0 = "hardware_timestamps")) ||
        (data.fixed_nominal_bitrates === void 0 &&
          (missing0 = "fixed_nominal_bitrates")) ||
        (data.fixed_data_bitrates === void 0 &&
          (missing0 = "fixed_data_bitrates"))
      ) {
        validate170.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.backend !== void 0) {
          const _errs1 = errors;
          if (typeof data.backend !== "string") {
            validate170.errors = [
              {
                instancePath: instancePath + "/backend",
                schemaPath: "#/properties/backend/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.channel_id !== void 0) {
            const _errs3 = errors;
            if (typeof data.channel_id !== "string") {
              validate170.errors = [
                {
                  instancePath: instancePath + "/channel_id",
                  schemaPath: "#/properties/channel_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.data_timing !== void 0) {
              let data2 = data.data_timing;
              const _errs5 = errors;
              const _errs6 = errors;
              let valid1 = false;
              const _errs7 = errors;
              if (
                !validate25(data2, {
                  instancePath: instancePath + "/data_timing",
                  parentData: data,
                  parentDataProperty: "data_timing",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate25.errors
                    : vErrors.concat(validate25.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs7 === errors;
              valid1 = valid1 || _valid0;
              if (!valid1) {
                const _errs8 = errors;
                if (data2 !== null) {
                  const err0 = {
                    instancePath: instancePath + "/data_timing",
                    schemaPath: "#/properties/data_timing/anyOf/1/type",
                    keyword: "type",
                    params: { type: "null" },
                    message: "must be null",
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs8 === errors;
                valid1 = valid1 || _valid0;
              }
              if (!valid1) {
                const err1 = {
                  instancePath: instancePath + "/data_timing",
                  schemaPath: "#/properties/data_timing/anyOf",
                  keyword: "anyOf",
                  params: {},
                  message: "must match a schema in anyOf",
                };
                if (vErrors === null) {
                  vErrors = [err1];
                } else {
                  vErrors.push(err1);
                }
                errors++;
                validate170.errors = vErrors;
                return false;
              } else {
                errors = _errs6;
                if (vErrors !== null) {
                  if (_errs6) {
                    vErrors.length = _errs6;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fd !== void 0) {
                const _errs10 = errors;
                if (typeof data.fd !== "boolean") {
                  validate170.errors = [
                    {
                      instancePath: instancePath + "/fd",
                      schemaPath: "#/properties/fd/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs10 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.fixed_data_bitrates !== void 0) {
                  let data4 = data.fixed_data_bitrates;
                  const _errs12 = errors;
                  if (errors === _errs12) {
                    if (Array.isArray(data4)) {
                      var valid2 = true;
                      const len0 = data4.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data5 = data4[i0];
                        const _errs14 = errors;
                        if (!(
                          typeof data5 == "number" &&
                          !(data5 % 1) &&
                          !isNaN(data5)
                        )) {
                          validate170.errors = [
                            {
                              instancePath:
                                instancePath + "/fixed_data_bitrates/" + i0,
                              schemaPath:
                                "#/properties/fixed_data_bitrates/items/type",
                              keyword: "type",
                              params: { type: "integer" },
                              message: "must be integer",
                            },
                          ];
                          return false;
                        }
                        if (errors === _errs14) {
                          if (typeof data5 == "number") {
                            if (data5 < 0 || isNaN(data5)) {
                              validate170.errors = [
                                {
                                  instancePath:
                                    instancePath + "/fixed_data_bitrates/" + i0,
                                  schemaPath:
                                    "#/properties/fixed_data_bitrates/items/minimum",
                                  keyword: "minimum",
                                  params: { comparison: ">=", limit: 0 },
                                  message: "must be >= 0",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                        var valid2 = _errs14 === errors;
                        if (!valid2) {
                          break;
                        }
                      }
                    } else {
                      validate170.errors = [
                        {
                          instancePath: instancePath + "/fixed_data_bitrates",
                          schemaPath: "#/properties/fixed_data_bitrates/type",
                          keyword: "type",
                          params: { type: "array" },
                          message: "must be array",
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.fixed_nominal_bitrates !== void 0) {
                    let data6 = data.fixed_nominal_bitrates;
                    const _errs16 = errors;
                    if (errors === _errs16) {
                      if (Array.isArray(data6)) {
                        var valid3 = true;
                        const len1 = data6.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          let data7 = data6[i1];
                          const _errs18 = errors;
                          if (!(
                            typeof data7 == "number" &&
                            !(data7 % 1) &&
                            !isNaN(data7)
                          )) {
                            validate170.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  "/fixed_nominal_bitrates/" +
                                  i1,
                                schemaPath:
                                  "#/properties/fixed_nominal_bitrates/items/type",
                                keyword: "type",
                                params: { type: "integer" },
                                message: "must be integer",
                              },
                            ];
                            return false;
                          }
                          if (errors === _errs18) {
                            if (typeof data7 == "number") {
                              if (data7 < 0 || isNaN(data7)) {
                                validate170.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/fixed_nominal_bitrates/" +
                                      i1,
                                    schemaPath:
                                      "#/properties/fixed_nominal_bitrates/items/minimum",
                                    keyword: "minimum",
                                    params: { comparison: ">=", limit: 0 },
                                    message: "must be >= 0",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                          var valid3 = _errs18 === errors;
                          if (!valid3) {
                            break;
                          }
                        }
                      } else {
                        validate170.errors = [
                          {
                            instancePath:
                              instancePath + "/fixed_nominal_bitrates",
                            schemaPath:
                              "#/properties/fixed_nominal_bitrates/type",
                            keyword: "type",
                            params: { type: "array" },
                            message: "must be array",
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs16 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.hardware_timestamps !== void 0) {
                      const _errs20 = errors;
                      if (typeof data.hardware_timestamps !== "boolean") {
                        validate170.errors = [
                          {
                            instancePath: instancePath + "/hardware_timestamps",
                            schemaPath: "#/properties/hardware_timestamps/type",
                            keyword: "type",
                            params: { type: "boolean" },
                            message: "must be boolean",
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs20 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.listen_only !== void 0) {
                        const _errs22 = errors;
                        if (typeof data.listen_only !== "boolean") {
                          validate170.errors = [
                            {
                              instancePath: instancePath + "/listen_only",
                              schemaPath: "#/properties/listen_only/type",
                              keyword: "type",
                              params: { type: "boolean" },
                              message: "must be boolean",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs22 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.nominal_timing !== void 0) {
                          let data10 = data.nominal_timing;
                          const _errs24 = errors;
                          const _errs25 = errors;
                          let valid4 = false;
                          const _errs26 = errors;
                          if (
                            !validate25(data10, {
                              instancePath: instancePath + "/nominal_timing",
                              parentData: data,
                              parentDataProperty: "nominal_timing",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate25.errors
                                : vErrors.concat(validate25.errors);
                            errors = vErrors.length;
                          }
                          var _valid1 = _errs26 === errors;
                          valid4 = valid4 || _valid1;
                          if (!valid4) {
                            const _errs27 = errors;
                            if (data10 !== null) {
                              const err2 = {
                                instancePath: instancePath + "/nominal_timing",
                                schemaPath:
                                  "#/properties/nominal_timing/anyOf/1/type",
                                keyword: "type",
                                params: { type: "null" },
                                message: "must be null",
                              };
                              if (vErrors === null) {
                                vErrors = [err2];
                              } else {
                                vErrors.push(err2);
                              }
                              errors++;
                            }
                            var _valid1 = _errs27 === errors;
                            valid4 = valid4 || _valid1;
                          }
                          if (!valid4) {
                            const err3 = {
                              instancePath: instancePath + "/nominal_timing",
                              schemaPath: "#/properties/nominal_timing/anyOf",
                              keyword: "anyOf",
                              params: {},
                              message: "must match a schema in anyOf",
                            };
                            if (vErrors === null) {
                              vErrors = [err3];
                            } else {
                              vErrors.push(err3);
                            }
                            errors++;
                            validate170.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs25;
                            if (vErrors !== null) {
                              if (_errs25) {
                                vErrors.length = _errs25;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs24 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.simulated !== void 0) {
                            const _errs29 = errors;
                            if (typeof data.simulated !== "boolean") {
                              validate170.errors = [
                                {
                                  instancePath: instancePath + "/simulated",
                                  schemaPath: "#/properties/simulated/type",
                                  keyword: "type",
                                  params: { type: "boolean" },
                                  message: "must be boolean",
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs29 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate170.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate170.errors = vErrors;
  return errors === 0;
}
var capture = validate173;
var schema10 = {
  type: "object",
  properties: {
    bytes: { $ref: "#/definitions/Decimal" },
    complete: { type: "boolean" },
    dropped: { $ref: "#/definitions/Decimal" },
    events: { $ref: "#/definitions/Decimal" },
    expires_unix_ms: { type: "string" },
    id: { type: "string" },
    loss_count_known: { type: "boolean" },
    reason: { type: ["string", "null"] },
    session_id: { type: "string" },
    state: { $ref: "#/definitions/CaptureState" },
  },
  required: [
    "id",
    "session_id",
    "state",
    "complete",
    "loss_count_known",
    "expires_unix_ms",
    "events",
    "dropped",
    "bytes",
  ],
};
var pattern0 = new RegExp(
  "^(0|[1-9][0-9]{0,18}|18446744073709551615|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]{1}|1844674407370955161[0-4])$",
  "u",
);
function validate30(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (typeof data === "string") {
      if (!pattern0.test(data)) {
        validate30.errors = [
          {
            instancePath,
            schemaPath: "#/pattern",
            keyword: "pattern",
            params: {
              pattern:
                "^(0|[1-9][0-9]{0,18}|18446744073709551615|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]{1}|1844674407370955161[0-4])$",
            },
            message:
              'must match pattern "^(0|[1-9][0-9]{0,18}|18446744073709551615|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]{1}|1844674407370955161[0-4])$"',
          },
        ];
        return false;
      }
    } else {
      validate30.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "string" },
          message: "must be string",
        },
      ];
      return false;
    }
  }
  validate30.errors = vErrors;
  return errors === 0;
}
var schema12 = {
  type: "string",
  enum: ["starting", "recording", "completed", "incomplete", "failed"],
};
function validate34(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate34.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "starting" ||
    data === "recording" ||
    data === "completed" ||
    data === "incomplete" ||
    data === "failed"
  )) {
    validate34.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema12.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate34.errors = vErrors;
  return errors === 0;
}
function validate173(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.session_id === void 0 && (missing0 = "session_id")) ||
        (data.state === void 0 && (missing0 = "state")) ||
        (data.complete === void 0 && (missing0 = "complete")) ||
        (data.loss_count_known === void 0 && (missing0 = "loss_count_known")) ||
        (data.expires_unix_ms === void 0 && (missing0 = "expires_unix_ms")) ||
        (data.events === void 0 && (missing0 = "events")) ||
        (data.dropped === void 0 && (missing0 = "dropped")) ||
        (data.bytes === void 0 && (missing0 = "bytes"))
      ) {
        validate173.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.bytes !== void 0) {
          const _errs1 = errors;
          if (
            !validate30(data.bytes, {
              instancePath: instancePath + "/bytes",
              parentData: data,
              parentDataProperty: "bytes",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate30.errors
                : vErrors.concat(validate30.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.complete !== void 0) {
            const _errs2 = errors;
            if (typeof data.complete !== "boolean") {
              validate173.errors = [
                {
                  instancePath: instancePath + "/complete",
                  schemaPath: "#/properties/complete/type",
                  keyword: "type",
                  params: { type: "boolean" },
                  message: "must be boolean",
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.dropped !== void 0) {
              const _errs4 = errors;
              if (
                !validate30(data.dropped, {
                  instancePath: instancePath + "/dropped",
                  parentData: data,
                  parentDataProperty: "dropped",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.events !== void 0) {
                const _errs5 = errors;
                if (
                  !validate30(data.events, {
                    instancePath: instancePath + "/events",
                    parentData: data,
                    parentDataProperty: "events",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate30.errors
                      : vErrors.concat(validate30.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.expires_unix_ms !== void 0) {
                  const _errs6 = errors;
                  if (typeof data.expires_unix_ms !== "string") {
                    validate173.errors = [
                      {
                        instancePath: instancePath + "/expires_unix_ms",
                        schemaPath: "#/properties/expires_unix_ms/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.id !== void 0) {
                    const _errs8 = errors;
                    if (typeof data.id !== "string") {
                      validate173.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.loss_count_known !== void 0) {
                      const _errs10 = errors;
                      if (typeof data.loss_count_known !== "boolean") {
                        validate173.errors = [
                          {
                            instancePath: instancePath + "/loss_count_known",
                            schemaPath: "#/properties/loss_count_known/type",
                            keyword: "type",
                            params: { type: "boolean" },
                            message: "must be boolean",
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs10 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.reason !== void 0) {
                        let data7 = data.reason;
                        const _errs12 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate173.errors = [
                            {
                              instancePath: instancePath + "/reason",
                              schemaPath: "#/properties/reason/type",
                              keyword: "type",
                              params: { type: schema10.properties.reason.type },
                              message: "must be string,null",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs12 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.session_id !== void 0) {
                          const _errs14 = errors;
                          if (typeof data.session_id !== "string") {
                            validate173.errors = [
                              {
                                instancePath: instancePath + "/session_id",
                                schemaPath: "#/properties/session_id/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs14 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.state !== void 0) {
                            const _errs16 = errors;
                            if (
                              !validate34(data.state, {
                                instancePath: instancePath + "/state",
                                parentData: data,
                                parentDataProperty: "state",
                                rootData,
                              })
                            ) {
                              vErrors =
                                vErrors === null
                                  ? validate34.errors
                                  : vErrors.concat(validate34.errors);
                              errors = vErrors.length;
                            }
                            var valid0 = _errs16 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate173.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate173.errors = vErrors;
  return errors === 0;
}
var capture_request = validate178;
var func2 = require_ucs2length().default;
function validate178(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.session_id === void 0 && (missing0 = "session_id")) ||
        (data.client_request_id === void 0 && (missing0 = "client_request_id"))
      ) {
        validate178.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "client_request_id" ||
            key0 === "max_duration_seconds" ||
            key0 === "session_id"
          )) {
            validate178.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.client_request_id !== void 0) {
            let data0 = data.client_request_id;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func2(data0) > 128) {
                  validate178.errors = [
                    {
                      instancePath: instancePath + "/client_request_id",
                      schemaPath: "#/properties/client_request_id/maxLength",
                      keyword: "maxLength",
                      params: { limit: 128 },
                      message: "must NOT have more than 128 characters",
                    },
                  ];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate178.errors = [
                      {
                        instancePath: instancePath + "/client_request_id",
                        schemaPath: "#/properties/client_request_id/minLength",
                        keyword: "minLength",
                        params: { limit: 1 },
                        message: "must NOT have fewer than 1 characters",
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate178.errors = [
                  {
                    instancePath: instancePath + "/client_request_id",
                    schemaPath: "#/properties/client_request_id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.max_duration_seconds !== void 0) {
              let data1 = data.max_duration_seconds;
              const _errs4 = errors;
              if (!(
                typeof data1 == "number" &&
                !(data1 % 1) &&
                !isNaN(data1)
              )) {
                validate178.errors = [
                  {
                    instancePath: instancePath + "/max_duration_seconds",
                    schemaPath: "#/properties/max_duration_seconds/type",
                    keyword: "type",
                    params: { type: "integer" },
                    message: "must be integer",
                  },
                ];
                return false;
              }
              if (errors === _errs4) {
                if (typeof data1 == "number") {
                  if (data1 > 86400 || isNaN(data1)) {
                    validate178.errors = [
                      {
                        instancePath: instancePath + "/max_duration_seconds",
                        schemaPath: "#/properties/max_duration_seconds/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 86400 },
                        message: "must be <= 86400",
                      },
                    ];
                    return false;
                  } else {
                    if (data1 < 1 || isNaN(data1)) {
                      validate178.errors = [
                        {
                          instancePath: instancePath + "/max_duration_seconds",
                          schemaPath:
                            "#/properties/max_duration_seconds/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 1 },
                          message: "must be >= 1",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.session_id !== void 0) {
                const _errs6 = errors;
                if (typeof data.session_id !== "string") {
                  validate178.errors = [
                    {
                      instancePath: instancePath + "/session_id",
                      schemaPath: "#/properties/session_id/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate178.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate178.errors = vErrors;
  return errors === 0;
}
var captures = validate179;
function validate29(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.session_id === void 0 && (missing0 = "session_id")) ||
        (data.state === void 0 && (missing0 = "state")) ||
        (data.complete === void 0 && (missing0 = "complete")) ||
        (data.loss_count_known === void 0 && (missing0 = "loss_count_known")) ||
        (data.expires_unix_ms === void 0 && (missing0 = "expires_unix_ms")) ||
        (data.events === void 0 && (missing0 = "events")) ||
        (data.dropped === void 0 && (missing0 = "dropped")) ||
        (data.bytes === void 0 && (missing0 = "bytes"))
      ) {
        validate29.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.bytes !== void 0) {
          const _errs1 = errors;
          if (
            !validate30(data.bytes, {
              instancePath: instancePath + "/bytes",
              parentData: data,
              parentDataProperty: "bytes",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate30.errors
                : vErrors.concat(validate30.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.complete !== void 0) {
            const _errs2 = errors;
            if (typeof data.complete !== "boolean") {
              validate29.errors = [
                {
                  instancePath: instancePath + "/complete",
                  schemaPath: "#/properties/complete/type",
                  keyword: "type",
                  params: { type: "boolean" },
                  message: "must be boolean",
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.dropped !== void 0) {
              const _errs4 = errors;
              if (
                !validate30(data.dropped, {
                  instancePath: instancePath + "/dropped",
                  parentData: data,
                  parentDataProperty: "dropped",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.events !== void 0) {
                const _errs5 = errors;
                if (
                  !validate30(data.events, {
                    instancePath: instancePath + "/events",
                    parentData: data,
                    parentDataProperty: "events",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate30.errors
                      : vErrors.concat(validate30.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.expires_unix_ms !== void 0) {
                  const _errs6 = errors;
                  if (typeof data.expires_unix_ms !== "string") {
                    validate29.errors = [
                      {
                        instancePath: instancePath + "/expires_unix_ms",
                        schemaPath: "#/properties/expires_unix_ms/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.id !== void 0) {
                    const _errs8 = errors;
                    if (typeof data.id !== "string") {
                      validate29.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.loss_count_known !== void 0) {
                      const _errs10 = errors;
                      if (typeof data.loss_count_known !== "boolean") {
                        validate29.errors = [
                          {
                            instancePath: instancePath + "/loss_count_known",
                            schemaPath: "#/properties/loss_count_known/type",
                            keyword: "type",
                            params: { type: "boolean" },
                            message: "must be boolean",
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs10 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.reason !== void 0) {
                        let data7 = data.reason;
                        const _errs12 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate29.errors = [
                            {
                              instancePath: instancePath + "/reason",
                              schemaPath: "#/properties/reason/type",
                              keyword: "type",
                              params: { type: schema10.properties.reason.type },
                              message: "must be string,null",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs12 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.session_id !== void 0) {
                          const _errs14 = errors;
                          if (typeof data.session_id !== "string") {
                            validate29.errors = [
                              {
                                instancePath: instancePath + "/session_id",
                                schemaPath: "#/properties/session_id/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs14 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.state !== void 0) {
                            const _errs16 = errors;
                            if (
                              !validate34(data.state, {
                                instancePath: instancePath + "/state",
                                parentData: data,
                                parentDataProperty: "state",
                                rootData,
                              })
                            ) {
                              vErrors =
                                vErrors === null
                                  ? validate34.errors
                                  : vErrors.concat(validate34.errors);
                              errors = vErrors.length;
                            }
                            var valid0 = _errs16 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate29.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate29.errors = vErrors;
  return errors === 0;
}
function validate179(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.captures === void 0 && (missing0 = "captures")) {
        validate179.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.captures !== void 0) {
          let data0 = data.captures;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate29(data0[i0], {
                    instancePath: instancePath + "/captures/" + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate29.errors
                      : vErrors.concat(validate29.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate179.errors = [
                {
                  instancePath: instancePath + "/captures",
                  schemaPath: "#/properties/captures/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate179.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate179.errors = vErrors;
  return errors === 0;
}
var config = validate181;
function validate43(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.enabled === void 0 && (missing0 = "enabled")) ||
        (data.data_bitrate === void 0 && (missing0 = "data_bitrate")) ||
        (data.iso === void 0 && (missing0 = "iso"))
      ) {
        validate43.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "data_bitrate" ||
            key0 === "enabled" ||
            key0 === "iso"
          )) {
            validate43.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.data_bitrate !== void 0) {
            let data0 = data.data_bitrate;
            const _errs2 = errors;
            if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0))) {
              validate43.errors = [
                {
                  instancePath: instancePath + "/data_bitrate",
                  schemaPath: "#/properties/data_bitrate/type",
                  keyword: "type",
                  params: { type: "integer" },
                  message: "must be integer",
                },
              ];
              return false;
            }
            if (errors === _errs2) {
              if (typeof data0 == "number") {
                if (data0 < 0 || isNaN(data0)) {
                  validate43.errors = [
                    {
                      instancePath: instancePath + "/data_bitrate",
                      schemaPath: "#/properties/data_bitrate/minimum",
                      keyword: "minimum",
                      params: { comparison: ">=", limit: 0 },
                      message: "must be >= 0",
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.enabled !== void 0) {
              const _errs4 = errors;
              if (typeof data.enabled !== "boolean") {
                validate43.errors = [
                  {
                    instancePath: instancePath + "/enabled",
                    schemaPath: "#/properties/enabled/type",
                    keyword: "type",
                    params: { type: "boolean" },
                    message: "must be boolean",
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.iso !== void 0) {
                const _errs6 = errors;
                if (typeof data.iso !== "boolean") {
                  validate43.errors = [
                    {
                      instancePath: instancePath + "/iso",
                      schemaPath: "#/properties/iso/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate43.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate43.errors = vErrors;
  return errors === 0;
}
var schema17 = { type: "string", enum: ["active", "listen_only"] };
function validate45(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate45.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(data === "active" || data === "listen_only")) {
    validate45.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema17.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate45.errors = vErrors;
  return errors === 0;
}
function validate181(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.mode === void 0 && (missing0 = "mode")) ||
        (data.nominal_bitrate === void 0 && (missing0 = "nominal_bitrate"))
      ) {
        validate181.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "fd" ||
            key0 === "mode" ||
            key0 === "nominal_bitrate"
          )) {
            validate181.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.fd !== void 0) {
            let data0 = data.fd;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (
              !validate43(data0, {
                instancePath: instancePath + "/fd",
                parentData: data,
                parentDataProperty: "fd",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate43.errors
                  : vErrors.concat(validate43.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const _errs5 = errors;
              if (data0 !== null) {
                const err0 = {
                  instancePath: instancePath + "/fd",
                  schemaPath: "#/properties/fd/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
            }
            if (!valid1) {
              const err1 = {
                instancePath: instancePath + "/fd",
                schemaPath: "#/properties/fd/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate181.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.mode !== void 0) {
              const _errs7 = errors;
              if (
                !validate45(data.mode, {
                  instancePath: instancePath + "/mode",
                  parentData: data,
                  parentDataProperty: "mode",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate45.errors
                    : vErrors.concat(validate45.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nominal_bitrate !== void 0) {
                let data2 = data.nominal_bitrate;
                const _errs8 = errors;
                if (!(
                  typeof data2 == "number" &&
                  !(data2 % 1) &&
                  !isNaN(data2)
                )) {
                  validate181.errors = [
                    {
                      instancePath: instancePath + "/nominal_bitrate",
                      schemaPath: "#/properties/nominal_bitrate/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs8) {
                  if (typeof data2 == "number") {
                    if (data2 < 0 || isNaN(data2)) {
                      validate181.errors = [
                        {
                          instancePath: instancePath + "/nominal_bitrate",
                          schemaPath: "#/properties/nominal_bitrate/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 0 },
                          message: "must be >= 0",
                        },
                      ];
                      return false;
                    }
                  }
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate181.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate181.errors = vErrors;
  return errors === 0;
}
var counter = validate184;
function validate184(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (typeof data === "string") {
      if (!pattern0.test(data)) {
        validate184.errors = [
          {
            instancePath,
            schemaPath: "#/pattern",
            keyword: "pattern",
            params: {
              pattern:
                "^(0|[1-9][0-9]{0,18}|18446744073709551615|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]{1}|1844674407370955161[0-4])$",
            },
            message:
              'must match pattern "^(0|[1-9][0-9]{0,18}|18446744073709551615|1[0-7][0-9]{18}|18[0-3][0-9]{17}|184[0-3][0-9]{16}|1844[0-5][0-9]{15}|18446[0-6][0-9]{14}|184467[0-3][0-9]{13}|1844674[0-3][0-9]{12}|184467440[0-6][0-9]{10}|1844674407[0-2][0-9]{9}|18446744073[0-6][0-9]{8}|1844674407370[0-8][0-9]{6}|18446744073709[0-4][0-9]{5}|184467440737095[0-4][0-9]{4}|18446744073709550[0-9]{3}|18446744073709551[0-5][0-9]{2}|1844674407370955160[0-9]{1}|1844674407370955161[0-4])$"',
          },
        ];
        return false;
      }
    } else {
      validate184.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "string" },
          message: "must be string",
        },
      ];
      return false;
    }
  }
  validate184.errors = vErrors;
  return errors === 0;
}
var create_request = validate185;
function validate42(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.mode === void 0 && (missing0 = "mode")) ||
        (data.nominal_bitrate === void 0 && (missing0 = "nominal_bitrate"))
      ) {
        validate42.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "fd" ||
            key0 === "mode" ||
            key0 === "nominal_bitrate"
          )) {
            validate42.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.fd !== void 0) {
            let data0 = data.fd;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (
              !validate43(data0, {
                instancePath: instancePath + "/fd",
                parentData: data,
                parentDataProperty: "fd",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate43.errors
                  : vErrors.concat(validate43.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const _errs5 = errors;
              if (data0 !== null) {
                const err0 = {
                  instancePath: instancePath + "/fd",
                  schemaPath: "#/properties/fd/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
            }
            if (!valid1) {
              const err1 = {
                instancePath: instancePath + "/fd",
                schemaPath: "#/properties/fd/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate42.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.mode !== void 0) {
              const _errs7 = errors;
              if (
                !validate45(data.mode, {
                  instancePath: instancePath + "/mode",
                  parentData: data,
                  parentDataProperty: "mode",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate45.errors
                    : vErrors.concat(validate45.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nominal_bitrate !== void 0) {
                let data2 = data.nominal_bitrate;
                const _errs8 = errors;
                if (!(
                  typeof data2 == "number" &&
                  !(data2 % 1) &&
                  !isNaN(data2)
                )) {
                  validate42.errors = [
                    {
                      instancePath: instancePath + "/nominal_bitrate",
                      schemaPath: "#/properties/nominal_bitrate/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs8) {
                  if (typeof data2 == "number") {
                    if (data2 < 0 || isNaN(data2)) {
                      validate42.errors = [
                        {
                          instancePath: instancePath + "/nominal_bitrate",
                          schemaPath: "#/properties/nominal_bitrate/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 0 },
                          message: "must be >= 0",
                        },
                      ];
                      return false;
                    }
                  }
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate42.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate42.errors = vErrors;
  return errors === 0;
}
function validate185(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.config === void 0 && (missing0 = "config"))
      ) {
        validate185.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "channel_id" || key0 === "config")) {
            validate185.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.channel_id !== void 0) {
            const _errs2 = errors;
            if (typeof data.channel_id !== "string") {
              validate185.errors = [
                {
                  instancePath: instancePath + "/channel_id",
                  schemaPath: "#/properties/channel_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.config !== void 0) {
              const _errs4 = errors;
              if (
                !validate42(data.config, {
                  instancePath: instancePath + "/config",
                  parentData: data,
                  parentDataProperty: "config",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate42.errors
                    : vErrors.concat(validate42.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate185.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate185.errors = vErrors;
  return errors === 0;
}
var device_report = validate187;
var schema20 = {
  type: "object",
  properties: {
    capabilities: {
      anyOf: [{ $ref: "#/definitions/Capabilities" }, { type: "null" }],
    },
    capability_error: { type: ["string", "null"] },
    channel_id: { type: "string" },
    communication_verified: {
      description:
        "Always false: exporting inventory does not perform a communication test.",
      type: "boolean",
    },
    device_model: { type: ["string", "null"] },
    firmware_version: { type: ["string", "null"] },
    label: { type: "string" },
    library_version: { type: ["string", "null"] },
    limitations: { type: "array", items: { type: "string" } },
    registered: { type: "boolean" },
    sessions: {
      type: "array",
      items: { $ref: "#/definitions/DiagnosticSession" },
    },
    verification: { type: "string" },
  },
  required: [
    "capabilities",
    "capability_error",
    "channel_id",
    "communication_verified",
    "device_model",
    "firmware_version",
    "label",
    "library_version",
    "limitations",
    "registered",
    "sessions",
    "verification",
  ],
};
function validate24(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.backend === void 0 && (missing0 = "backend")) ||
        (data.simulated === void 0 && (missing0 = "simulated")) ||
        (data.fd === void 0 && (missing0 = "fd")) ||
        (data.listen_only === void 0 && (missing0 = "listen_only")) ||
        (data.hardware_timestamps === void 0 &&
          (missing0 = "hardware_timestamps")) ||
        (data.fixed_nominal_bitrates === void 0 &&
          (missing0 = "fixed_nominal_bitrates")) ||
        (data.fixed_data_bitrates === void 0 &&
          (missing0 = "fixed_data_bitrates"))
      ) {
        validate24.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.backend !== void 0) {
          const _errs1 = errors;
          if (typeof data.backend !== "string") {
            validate24.errors = [
              {
                instancePath: instancePath + "/backend",
                schemaPath: "#/properties/backend/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.channel_id !== void 0) {
            const _errs3 = errors;
            if (typeof data.channel_id !== "string") {
              validate24.errors = [
                {
                  instancePath: instancePath + "/channel_id",
                  schemaPath: "#/properties/channel_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.data_timing !== void 0) {
              let data2 = data.data_timing;
              const _errs5 = errors;
              const _errs6 = errors;
              let valid1 = false;
              const _errs7 = errors;
              if (
                !validate25(data2, {
                  instancePath: instancePath + "/data_timing",
                  parentData: data,
                  parentDataProperty: "data_timing",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate25.errors
                    : vErrors.concat(validate25.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs7 === errors;
              valid1 = valid1 || _valid0;
              if (!valid1) {
                const _errs8 = errors;
                if (data2 !== null) {
                  const err0 = {
                    instancePath: instancePath + "/data_timing",
                    schemaPath: "#/properties/data_timing/anyOf/1/type",
                    keyword: "type",
                    params: { type: "null" },
                    message: "must be null",
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs8 === errors;
                valid1 = valid1 || _valid0;
              }
              if (!valid1) {
                const err1 = {
                  instancePath: instancePath + "/data_timing",
                  schemaPath: "#/properties/data_timing/anyOf",
                  keyword: "anyOf",
                  params: {},
                  message: "must match a schema in anyOf",
                };
                if (vErrors === null) {
                  vErrors = [err1];
                } else {
                  vErrors.push(err1);
                }
                errors++;
                validate24.errors = vErrors;
                return false;
              } else {
                errors = _errs6;
                if (vErrors !== null) {
                  if (_errs6) {
                    vErrors.length = _errs6;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fd !== void 0) {
                const _errs10 = errors;
                if (typeof data.fd !== "boolean") {
                  validate24.errors = [
                    {
                      instancePath: instancePath + "/fd",
                      schemaPath: "#/properties/fd/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs10 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.fixed_data_bitrates !== void 0) {
                  let data4 = data.fixed_data_bitrates;
                  const _errs12 = errors;
                  if (errors === _errs12) {
                    if (Array.isArray(data4)) {
                      var valid2 = true;
                      const len0 = data4.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data5 = data4[i0];
                        const _errs14 = errors;
                        if (!(
                          typeof data5 == "number" &&
                          !(data5 % 1) &&
                          !isNaN(data5)
                        )) {
                          validate24.errors = [
                            {
                              instancePath:
                                instancePath + "/fixed_data_bitrates/" + i0,
                              schemaPath:
                                "#/properties/fixed_data_bitrates/items/type",
                              keyword: "type",
                              params: { type: "integer" },
                              message: "must be integer",
                            },
                          ];
                          return false;
                        }
                        if (errors === _errs14) {
                          if (typeof data5 == "number") {
                            if (data5 < 0 || isNaN(data5)) {
                              validate24.errors = [
                                {
                                  instancePath:
                                    instancePath + "/fixed_data_bitrates/" + i0,
                                  schemaPath:
                                    "#/properties/fixed_data_bitrates/items/minimum",
                                  keyword: "minimum",
                                  params: { comparison: ">=", limit: 0 },
                                  message: "must be >= 0",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                        var valid2 = _errs14 === errors;
                        if (!valid2) {
                          break;
                        }
                      }
                    } else {
                      validate24.errors = [
                        {
                          instancePath: instancePath + "/fixed_data_bitrates",
                          schemaPath: "#/properties/fixed_data_bitrates/type",
                          keyword: "type",
                          params: { type: "array" },
                          message: "must be array",
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.fixed_nominal_bitrates !== void 0) {
                    let data6 = data.fixed_nominal_bitrates;
                    const _errs16 = errors;
                    if (errors === _errs16) {
                      if (Array.isArray(data6)) {
                        var valid3 = true;
                        const len1 = data6.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          let data7 = data6[i1];
                          const _errs18 = errors;
                          if (!(
                            typeof data7 == "number" &&
                            !(data7 % 1) &&
                            !isNaN(data7)
                          )) {
                            validate24.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  "/fixed_nominal_bitrates/" +
                                  i1,
                                schemaPath:
                                  "#/properties/fixed_nominal_bitrates/items/type",
                                keyword: "type",
                                params: { type: "integer" },
                                message: "must be integer",
                              },
                            ];
                            return false;
                          }
                          if (errors === _errs18) {
                            if (typeof data7 == "number") {
                              if (data7 < 0 || isNaN(data7)) {
                                validate24.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/fixed_nominal_bitrates/" +
                                      i1,
                                    schemaPath:
                                      "#/properties/fixed_nominal_bitrates/items/minimum",
                                    keyword: "minimum",
                                    params: { comparison: ">=", limit: 0 },
                                    message: "must be >= 0",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                          var valid3 = _errs18 === errors;
                          if (!valid3) {
                            break;
                          }
                        }
                      } else {
                        validate24.errors = [
                          {
                            instancePath:
                              instancePath + "/fixed_nominal_bitrates",
                            schemaPath:
                              "#/properties/fixed_nominal_bitrates/type",
                            keyword: "type",
                            params: { type: "array" },
                            message: "must be array",
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs16 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.hardware_timestamps !== void 0) {
                      const _errs20 = errors;
                      if (typeof data.hardware_timestamps !== "boolean") {
                        validate24.errors = [
                          {
                            instancePath: instancePath + "/hardware_timestamps",
                            schemaPath: "#/properties/hardware_timestamps/type",
                            keyword: "type",
                            params: { type: "boolean" },
                            message: "must be boolean",
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs20 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.listen_only !== void 0) {
                        const _errs22 = errors;
                        if (typeof data.listen_only !== "boolean") {
                          validate24.errors = [
                            {
                              instancePath: instancePath + "/listen_only",
                              schemaPath: "#/properties/listen_only/type",
                              keyword: "type",
                              params: { type: "boolean" },
                              message: "must be boolean",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs22 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.nominal_timing !== void 0) {
                          let data10 = data.nominal_timing;
                          const _errs24 = errors;
                          const _errs25 = errors;
                          let valid4 = false;
                          const _errs26 = errors;
                          if (
                            !validate25(data10, {
                              instancePath: instancePath + "/nominal_timing",
                              parentData: data,
                              parentDataProperty: "nominal_timing",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate25.errors
                                : vErrors.concat(validate25.errors);
                            errors = vErrors.length;
                          }
                          var _valid1 = _errs26 === errors;
                          valid4 = valid4 || _valid1;
                          if (!valid4) {
                            const _errs27 = errors;
                            if (data10 !== null) {
                              const err2 = {
                                instancePath: instancePath + "/nominal_timing",
                                schemaPath:
                                  "#/properties/nominal_timing/anyOf/1/type",
                                keyword: "type",
                                params: { type: "null" },
                                message: "must be null",
                              };
                              if (vErrors === null) {
                                vErrors = [err2];
                              } else {
                                vErrors.push(err2);
                              }
                              errors++;
                            }
                            var _valid1 = _errs27 === errors;
                            valid4 = valid4 || _valid1;
                          }
                          if (!valid4) {
                            const err3 = {
                              instancePath: instancePath + "/nominal_timing",
                              schemaPath: "#/properties/nominal_timing/anyOf",
                              keyword: "anyOf",
                              params: {},
                              message: "must match a schema in anyOf",
                            };
                            if (vErrors === null) {
                              vErrors = [err3];
                            } else {
                              vErrors.push(err3);
                            }
                            errors++;
                            validate24.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs25;
                            if (vErrors !== null) {
                              if (_errs25) {
                                vErrors.length = _errs25;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs24 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.simulated !== void 0) {
                            const _errs29 = errors;
                            if (typeof data.simulated !== "boolean") {
                              validate24.errors = [
                                {
                                  instancePath: instancePath + "/simulated",
                                  schemaPath: "#/properties/simulated/type",
                                  keyword: "type",
                                  params: { type: "boolean" },
                                  message: "must be boolean",
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs29 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate24.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate24.errors = vErrors;
  return errors === 0;
}
var schema22 = {
  type: "object",
  properties: {
    data_bitrate: { type: ["integer", "null"], format: "uint32", minimum: 0 },
    mode: { $ref: "#/definitions/SessionMode" },
    nominal_bitrate: { type: "integer", format: "uint32", minimum: 0 },
  },
  required: ["mode", "nominal_bitrate"],
};
function validate56(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.mode === void 0 && (missing0 = "mode")) ||
        (data.nominal_bitrate === void 0 && (missing0 = "nominal_bitrate"))
      ) {
        validate56.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.data_bitrate !== void 0) {
          let data0 = data.data_bitrate;
          const _errs1 = errors;
          if (
            !(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0)) &&
            data0 !== null
          ) {
            validate56.errors = [
              {
                instancePath: instancePath + "/data_bitrate",
                schemaPath: "#/properties/data_bitrate/type",
                keyword: "type",
                params: { type: schema22.properties.data_bitrate.type },
                message: "must be integer,null",
              },
            ];
            return false;
          }
          if (errors === _errs1) {
            if (typeof data0 == "number") {
              if (data0 < 0 || isNaN(data0)) {
                validate56.errors = [
                  {
                    instancePath: instancePath + "/data_bitrate",
                    schemaPath: "#/properties/data_bitrate/minimum",
                    keyword: "minimum",
                    params: { comparison: ">=", limit: 0 },
                    message: "must be >= 0",
                  },
                ];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.mode !== void 0) {
            const _errs3 = errors;
            if (
              !validate45(data.mode, {
                instancePath: instancePath + "/mode",
                parentData: data,
                parentDataProperty: "mode",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate45.errors
                  : vErrors.concat(validate45.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.nominal_bitrate !== void 0) {
              let data2 = data.nominal_bitrate;
              const _errs4 = errors;
              if (!(
                typeof data2 == "number" &&
                !(data2 % 1) &&
                !isNaN(data2)
              )) {
                validate56.errors = [
                  {
                    instancePath: instancePath + "/nominal_bitrate",
                    schemaPath: "#/properties/nominal_bitrate/type",
                    keyword: "type",
                    params: { type: "integer" },
                    message: "must be integer",
                  },
                ];
                return false;
              }
              if (errors === _errs4) {
                if (typeof data2 == "number") {
                  if (data2 < 0 || isNaN(data2)) {
                    validate56.errors = [
                      {
                        instancePath: instancePath + "/nominal_bitrate",
                        schemaPath: "#/properties/nominal_bitrate/minimum",
                        keyword: "minimum",
                        params: { comparison: ">=", limit: 0 },
                        message: "must be >= 0",
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate56.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate56.errors = vErrors;
  return errors === 0;
}
var schema23 = {
  type: "string",
  enum: [
    "device_disconnected",
    "bus_off",
    "receive_overflow",
    "transmit_failed",
    "stop_failed",
  ],
};
function validate59(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate59.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "device_disconnected" ||
    data === "bus_off" ||
    data === "receive_overflow" ||
    data === "transmit_failed" ||
    data === "stop_failed"
  )) {
    validate59.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema23.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
var schema24 = {
  type: "string",
  enum: ["configured", "running", "faulted", "disconnected"],
};
function validate61(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate61.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "configured" ||
    data === "running" ||
    data === "faulted" ||
    data === "disconnected"
  )) {
    validate61.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema24.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate61.errors = vErrors;
  return errors === 0;
}
function validate55(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.config === void 0 && (missing0 = "config")) ||
        (data.fault === void 0 && (missing0 = "fault")) ||
        (data.state === void 0 && (missing0 = "state"))
      ) {
        validate55.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.config !== void 0) {
          const _errs1 = errors;
          if (
            !validate56(data.config, {
              instancePath: instancePath + "/config",
              parentData: data,
              parentDataProperty: "config",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate56.errors
                : vErrors.concat(validate56.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.fault !== void 0) {
            let data1 = data.fault;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (
              !validate59(data1, {
                instancePath: instancePath + "/fault",
                parentData: data,
                parentDataProperty: "fault",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate59.errors
                  : vErrors.concat(validate59.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const _errs5 = errors;
              if (data1 !== null) {
                const err0 = {
                  instancePath: instancePath + "/fault",
                  schemaPath: "#/properties/fault/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
            }
            if (!valid1) {
              const err1 = {
                instancePath: instancePath + "/fault",
                schemaPath: "#/properties/fault/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate55.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.state !== void 0) {
              const _errs7 = errors;
              if (
                !validate61(data.state, {
                  instancePath: instancePath + "/state",
                  parentData: data,
                  parentDataProperty: "state",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate61.errors
                    : vErrors.concat(validate61.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate55.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate55.errors = vErrors;
  return errors === 0;
}
function validate53(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.capabilities === void 0 && (missing0 = "capabilities")) ||
        (data.capability_error === void 0 && (missing0 = "capability_error")) ||
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.communication_verified === void 0 &&
          (missing0 = "communication_verified")) ||
        (data.device_model === void 0 && (missing0 = "device_model")) ||
        (data.firmware_version === void 0 && (missing0 = "firmware_version")) ||
        (data.label === void 0 && (missing0 = "label")) ||
        (data.library_version === void 0 && (missing0 = "library_version")) ||
        (data.limitations === void 0 && (missing0 = "limitations")) ||
        (data.registered === void 0 && (missing0 = "registered")) ||
        (data.sessions === void 0 && (missing0 = "sessions")) ||
        (data.verification === void 0 && (missing0 = "verification"))
      ) {
        validate53.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.capabilities !== void 0) {
          let data0 = data.capabilities;
          const _errs1 = errors;
          const _errs2 = errors;
          let valid1 = false;
          const _errs3 = errors;
          if (
            !validate24(data0, {
              instancePath: instancePath + "/capabilities",
              parentData: data,
              parentDataProperty: "capabilities",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate24.errors
                : vErrors.concat(validate24.errors);
            errors = vErrors.length;
          }
          var _valid0 = _errs3 === errors;
          valid1 = valid1 || _valid0;
          if (!valid1) {
            const _errs4 = errors;
            if (data0 !== null) {
              const err0 = {
                instancePath: instancePath + "/capabilities",
                schemaPath: "#/properties/capabilities/anyOf/1/type",
                keyword: "type",
                params: { type: "null" },
                message: "must be null",
              };
              if (vErrors === null) {
                vErrors = [err0];
              } else {
                vErrors.push(err0);
              }
              errors++;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
          }
          if (!valid1) {
            const err1 = {
              instancePath: instancePath + "/capabilities",
              schemaPath: "#/properties/capabilities/anyOf",
              keyword: "anyOf",
              params: {},
              message: "must match a schema in anyOf",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
            validate53.errors = vErrors;
            return false;
          } else {
            errors = _errs2;
            if (vErrors !== null) {
              if (_errs2) {
                vErrors.length = _errs2;
              } else {
                vErrors = null;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.capability_error !== void 0) {
            let data1 = data.capability_error;
            const _errs6 = errors;
            if (typeof data1 !== "string" && data1 !== null) {
              validate53.errors = [
                {
                  instancePath: instancePath + "/capability_error",
                  schemaPath: "#/properties/capability_error/type",
                  keyword: "type",
                  params: { type: schema20.properties.capability_error.type },
                  message: "must be string,null",
                },
              ];
              return false;
            }
            var valid0 = _errs6 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.channel_id !== void 0) {
              const _errs8 = errors;
              if (typeof data.channel_id !== "string") {
                validate53.errors = [
                  {
                    instancePath: instancePath + "/channel_id",
                    schemaPath: "#/properties/channel_id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs8 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.communication_verified !== void 0) {
                const _errs10 = errors;
                if (typeof data.communication_verified !== "boolean") {
                  validate53.errors = [
                    {
                      instancePath: instancePath + "/communication_verified",
                      schemaPath: "#/properties/communication_verified/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs10 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.device_model !== void 0) {
                  let data4 = data.device_model;
                  const _errs12 = errors;
                  if (typeof data4 !== "string" && data4 !== null) {
                    validate53.errors = [
                      {
                        instancePath: instancePath + "/device_model",
                        schemaPath: "#/properties/device_model/type",
                        keyword: "type",
                        params: { type: schema20.properties.device_model.type },
                        message: "must be string,null",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.firmware_version !== void 0) {
                    let data5 = data.firmware_version;
                    const _errs14 = errors;
                    if (typeof data5 !== "string" && data5 !== null) {
                      validate53.errors = [
                        {
                          instancePath: instancePath + "/firmware_version",
                          schemaPath: "#/properties/firmware_version/type",
                          keyword: "type",
                          params: {
                            type: schema20.properties.firmware_version.type,
                          },
                          message: "must be string,null",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs14 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.label !== void 0) {
                      const _errs16 = errors;
                      if (typeof data.label !== "string") {
                        validate53.errors = [
                          {
                            instancePath: instancePath + "/label",
                            schemaPath: "#/properties/label/type",
                            keyword: "type",
                            params: { type: "string" },
                            message: "must be string",
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs16 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.library_version !== void 0) {
                        let data7 = data.library_version;
                        const _errs18 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate53.errors = [
                            {
                              instancePath: instancePath + "/library_version",
                              schemaPath: "#/properties/library_version/type",
                              keyword: "type",
                              params: {
                                type: schema20.properties.library_version.type,
                              },
                              message: "must be string,null",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs18 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.limitations !== void 0) {
                          let data8 = data.limitations;
                          const _errs20 = errors;
                          if (errors === _errs20) {
                            if (Array.isArray(data8)) {
                              var valid2 = true;
                              const len0 = data8.length;
                              for (let i0 = 0; i0 < len0; i0++) {
                                const _errs22 = errors;
                                if (typeof data8[i0] !== "string") {
                                  validate53.errors = [
                                    {
                                      instancePath:
                                        instancePath + "/limitations/" + i0,
                                      schemaPath:
                                        "#/properties/limitations/items/type",
                                      keyword: "type",
                                      params: { type: "string" },
                                      message: "must be string",
                                    },
                                  ];
                                  return false;
                                }
                                var valid2 = _errs22 === errors;
                                if (!valid2) {
                                  break;
                                }
                              }
                            } else {
                              validate53.errors = [
                                {
                                  instancePath: instancePath + "/limitations",
                                  schemaPath: "#/properties/limitations/type",
                                  keyword: "type",
                                  params: { type: "array" },
                                  message: "must be array",
                                },
                              ];
                              return false;
                            }
                          }
                          var valid0 = _errs20 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.registered !== void 0) {
                            const _errs24 = errors;
                            if (typeof data.registered !== "boolean") {
                              validate53.errors = [
                                {
                                  instancePath: instancePath + "/registered",
                                  schemaPath: "#/properties/registered/type",
                                  keyword: "type",
                                  params: { type: "boolean" },
                                  message: "must be boolean",
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs24 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.sessions !== void 0) {
                              let data11 = data.sessions;
                              const _errs26 = errors;
                              if (errors === _errs26) {
                                if (Array.isArray(data11)) {
                                  var valid3 = true;
                                  const len1 = data11.length;
                                  for (let i1 = 0; i1 < len1; i1++) {
                                    const _errs28 = errors;
                                    if (
                                      !validate55(data11[i1], {
                                        instancePath:
                                          instancePath + "/sessions/" + i1,
                                        parentData: data11,
                                        parentDataProperty: i1,
                                        rootData,
                                      })
                                    ) {
                                      vErrors =
                                        vErrors === null
                                          ? validate55.errors
                                          : vErrors.concat(validate55.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid3 = _errs28 === errors;
                                    if (!valid3) {
                                      break;
                                    }
                                  }
                                } else {
                                  validate53.errors = [
                                    {
                                      instancePath: instancePath + "/sessions",
                                      schemaPath: "#/properties/sessions/type",
                                      keyword: "type",
                                      params: { type: "array" },
                                      message: "must be array",
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid0 = _errs26 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.verification !== void 0) {
                                const _errs29 = errors;
                                if (typeof data.verification !== "string") {
                                  validate53.errors = [
                                    {
                                      instancePath:
                                        instancePath + "/verification",
                                      schemaPath:
                                        "#/properties/verification/type",
                                      keyword: "type",
                                      params: { type: "string" },
                                      message: "must be string",
                                    },
                                  ];
                                  return false;
                                }
                                var valid0 = _errs29 === errors;
                              } else {
                                var valid0 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate53.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate53.errors = vErrors;
  return errors === 0;
}
var schema25 = {
  type: "object",
  properties: {
    architecture: { type: "string" },
    kernel_release: {
      description:
        "Kernel release, not the macOS product version. No hostname is collected.",
      type: ["string", "null"],
    },
    os: { type: "string" },
  },
  required: ["architecture", "kernel_release", "os"],
};
function validate66(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.architecture === void 0 && (missing0 = "architecture")) ||
        (data.kernel_release === void 0 && (missing0 = "kernel_release")) ||
        (data.os === void 0 && (missing0 = "os"))
      ) {
        validate66.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.architecture !== void 0) {
          const _errs1 = errors;
          if (typeof data.architecture !== "string") {
            validate66.errors = [
              {
                instancePath: instancePath + "/architecture",
                schemaPath: "#/properties/architecture/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.kernel_release !== void 0) {
            let data1 = data.kernel_release;
            const _errs3 = errors;
            if (typeof data1 !== "string" && data1 !== null) {
              validate66.errors = [
                {
                  instancePath: instancePath + "/kernel_release",
                  schemaPath: "#/properties/kernel_release/type",
                  keyword: "type",
                  params: { type: schema25.properties.kernel_release.type },
                  message: "must be string,null",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.os !== void 0) {
              const _errs5 = errors;
              if (typeof data.os !== "string") {
                validate66.errors = [
                  {
                    instancePath: instancePath + "/os",
                    schemaPath: "#/properties/os/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate66.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate66.errors = vErrors;
  return errors === 0;
}
function validate187(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.report_version === void 0 && (missing0 = "report_version")) ||
        (data.generated_unix_ms === void 0 &&
          (missing0 = "generated_unix_ms")) ||
        (data.service_version === void 0 && (missing0 = "service_version")) ||
        (data.server_instance_id === void 0 &&
          (missing0 = "server_instance_id")) ||
        (data.host === void 0 && (missing0 = "host")) ||
        (data.channels === void 0 && (missing0 = "channels"))
      ) {
        validate187.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.channels !== void 0) {
          let data0 = data.channels;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate53(data0[i0], {
                    instancePath: instancePath + "/channels/" + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate53.errors
                      : vErrors.concat(validate53.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate187.errors = [
                {
                  instancePath: instancePath + "/channels",
                  schemaPath: "#/properties/channels/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.generated_unix_ms !== void 0) {
            const _errs4 = errors;
            if (
              !validate30(data.generated_unix_ms, {
                instancePath: instancePath + "/generated_unix_ms",
                parentData: data,
                parentDataProperty: "generated_unix_ms",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate30.errors
                  : vErrors.concat(validate30.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.host !== void 0) {
              const _errs5 = errors;
              if (
                !validate66(data.host, {
                  instancePath: instancePath + "/host",
                  parentData: data,
                  parentDataProperty: "host",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate66.errors
                    : vErrors.concat(validate66.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.report_version !== void 0) {
                const _errs6 = errors;
                if (typeof data.report_version !== "string") {
                  validate187.errors = [
                    {
                      instancePath: instancePath + "/report_version",
                      schemaPath: "#/properties/report_version/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.server_instance_id !== void 0) {
                  const _errs8 = errors;
                  if (typeof data.server_instance_id !== "string") {
                    validate187.errors = [
                      {
                        instancePath: instancePath + "/server_instance_id",
                        schemaPath: "#/properties/server_instance_id/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.service_version !== void 0) {
                    const _errs10 = errors;
                    if (typeof data.service_version !== "string") {
                      validate187.errors = [
                        {
                          instancePath: instancePath + "/service_version",
                          schemaPath: "#/properties/service_version/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate187.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate187.errors = vErrors;
  return errors === 0;
}
var devices = validate191;
function validate71(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.label === void 0 && (missing0 = "label")) ||
        (data.fd === void 0 && (missing0 = "fd")) ||
        (data.listen_only === void 0 && (missing0 = "listen_only"))
      ) {
        validate71.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.fd !== void 0) {
          const _errs1 = errors;
          if (typeof data.fd !== "boolean") {
            validate71.errors = [
              {
                instancePath: instancePath + "/fd",
                schemaPath: "#/properties/fd/type",
                keyword: "type",
                params: { type: "boolean" },
                message: "must be boolean",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.id !== void 0) {
            const _errs3 = errors;
            if (typeof data.id !== "string") {
              validate71.errors = [
                {
                  instancePath: instancePath + "/id",
                  schemaPath: "#/properties/id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.label !== void 0) {
              const _errs5 = errors;
              if (typeof data.label !== "string") {
                validate71.errors = [
                  {
                    instancePath: instancePath + "/label",
                    schemaPath: "#/properties/label/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.listen_only !== void 0) {
                const _errs7 = errors;
                if (typeof data.listen_only !== "boolean") {
                  validate71.errors = [
                    {
                      instancePath: instancePath + "/listen_only",
                      schemaPath: "#/properties/listen_only/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate71.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate71.errors = vErrors;
  return errors === 0;
}
function validate70(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.label === void 0 && (missing0 = "label")) ||
        (data.backend === void 0 && (missing0 = "backend")) ||
        (data.simulated === void 0 && (missing0 = "simulated")) ||
        (data.verification === void 0 && (missing0 = "verification")) ||
        (data.channels === void 0 && (missing0 = "channels"))
      ) {
        validate70.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.backend !== void 0) {
          const _errs1 = errors;
          if (typeof data.backend !== "string") {
            validate70.errors = [
              {
                instancePath: instancePath + "/backend",
                schemaPath: "#/properties/backend/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.channels !== void 0) {
            let data1 = data.channels;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (Array.isArray(data1)) {
                var valid1 = true;
                const len0 = data1.length;
                for (let i0 = 0; i0 < len0; i0++) {
                  const _errs5 = errors;
                  if (
                    !validate71(data1[i0], {
                      instancePath: instancePath + "/channels/" + i0,
                      parentData: data1,
                      parentDataProperty: i0,
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate71.errors
                        : vErrors.concat(validate71.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs5 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate70.errors = [
                  {
                    instancePath: instancePath + "/channels",
                    schemaPath: "#/properties/channels/type",
                    keyword: "type",
                    params: { type: "array" },
                    message: "must be array",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.id !== void 0) {
              const _errs6 = errors;
              if (typeof data.id !== "string") {
                validate70.errors = [
                  {
                    instancePath: instancePath + "/id",
                    schemaPath: "#/properties/id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.label !== void 0) {
                const _errs8 = errors;
                if (typeof data.label !== "string") {
                  validate70.errors = [
                    {
                      instancePath: instancePath + "/label",
                      schemaPath: "#/properties/label/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.simulated !== void 0) {
                  const _errs10 = errors;
                  if (typeof data.simulated !== "boolean") {
                    validate70.errors = [
                      {
                        instancePath: instancePath + "/simulated",
                        schemaPath: "#/properties/simulated/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.verification !== void 0) {
                    const _errs12 = errors;
                    if (typeof data.verification !== "string") {
                      validate70.errors = [
                        {
                          instancePath: instancePath + "/verification",
                          schemaPath: "#/properties/verification/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate70.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate70.errors = vErrors;
  return errors === 0;
}
function validate191(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.devices === void 0 && (missing0 = "devices")) {
        validate191.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.devices !== void 0) {
          let data0 = data.devices;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate70(data0[i0], {
                    instancePath: instancePath + "/devices/" + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate70.errors
                      : vErrors.concat(validate70.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate191.errors = [
                {
                  instancePath: instancePath + "/devices",
                  schemaPath: "#/properties/devices/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate191.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate191.errors = vErrors;
  return errors === 0;
}
var diagnostics = validate193;
function validate193(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.stage === void 0 && (missing0 = "stage")) ||
        (data.hardware_backends === void 0 &&
          (missing0 = "hardware_backends")) ||
        (data.session_count === void 0 && (missing0 = "session_count")) ||
        (data.stream_capacity === void 0 && (missing0 = "stream_capacity")) ||
        (data.ws_slots_available === void 0 &&
          (missing0 = "ws_slots_available"))
      ) {
        validate193.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.hardware_backends !== void 0) {
          let data0 = data.hardware_backends;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (typeof data0[i0] !== "string") {
                  validate193.errors = [
                    {
                      instancePath: instancePath + "/hardware_backends/" + i0,
                      schemaPath: "#/properties/hardware_backends/items/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate193.errors = [
                {
                  instancePath: instancePath + "/hardware_backends",
                  schemaPath: "#/properties/hardware_backends/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.session_count !== void 0) {
            let data2 = data.session_count;
            const _errs5 = errors;
            if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2))) {
              validate193.errors = [
                {
                  instancePath: instancePath + "/session_count",
                  schemaPath: "#/properties/session_count/type",
                  keyword: "type",
                  params: { type: "integer" },
                  message: "must be integer",
                },
              ];
              return false;
            }
            if (errors === _errs5) {
              if (typeof data2 == "number") {
                if (data2 < 0 || isNaN(data2)) {
                  validate193.errors = [
                    {
                      instancePath: instancePath + "/session_count",
                      schemaPath: "#/properties/session_count/minimum",
                      keyword: "minimum",
                      params: { comparison: ">=", limit: 0 },
                      message: "must be >= 0",
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs5 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.stage !== void 0) {
              const _errs7 = errors;
              if (typeof data.stage !== "string") {
                validate193.errors = [
                  {
                    instancePath: instancePath + "/stage",
                    schemaPath: "#/properties/stage/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.stream_capacity !== void 0) {
                let data4 = data.stream_capacity;
                const _errs9 = errors;
                if (!(
                  typeof data4 == "number" &&
                  !(data4 % 1) &&
                  !isNaN(data4)
                )) {
                  validate193.errors = [
                    {
                      instancePath: instancePath + "/stream_capacity",
                      schemaPath: "#/properties/stream_capacity/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs9) {
                  if (typeof data4 == "number") {
                    if (data4 < 0 || isNaN(data4)) {
                      validate193.errors = [
                        {
                          instancePath: instancePath + "/stream_capacity",
                          schemaPath: "#/properties/stream_capacity/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 0 },
                          message: "must be >= 0",
                        },
                      ];
                      return false;
                    }
                  }
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.ws_slots_available !== void 0) {
                  let data5 = data.ws_slots_available;
                  const _errs11 = errors;
                  if (!(
                    typeof data5 == "number" &&
                    !(data5 % 1) &&
                    !isNaN(data5)
                  )) {
                    validate193.errors = [
                      {
                        instancePath: instancePath + "/ws_slots_available",
                        schemaPath: "#/properties/ws_slots_available/type",
                        keyword: "type",
                        params: { type: "integer" },
                        message: "must be integer",
                      },
                    ];
                    return false;
                  }
                  if (errors === _errs11) {
                    if (typeof data5 == "number") {
                      if (data5 < 0 || isNaN(data5)) {
                        validate193.errors = [
                          {
                            instancePath: instancePath + "/ws_slots_available",
                            schemaPath:
                              "#/properties/ws_slots_available/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate193.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate193.errors = vErrors;
  return errors === 0;
}
var error = validate194;
var schema31 = {
  type: "object",
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    outcome_unknown: { type: "boolean", default: false },
    receipt: { type: ["string", "null"] },
    request_id: { type: "string" },
    retryable: { type: "boolean" },
  },
  required: ["code", "message", "retryable", "request_id"],
};
function validate78(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.code === void 0 && (missing0 = "code")) ||
        (data.message === void 0 && (missing0 = "message")) ||
        (data.retryable === void 0 && (missing0 = "retryable")) ||
        (data.request_id === void 0 && (missing0 = "request_id"))
      ) {
        validate78.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.code !== void 0) {
          const _errs1 = errors;
          if (typeof data.code !== "string") {
            validate78.errors = [
              {
                instancePath: instancePath + "/code",
                schemaPath: "#/properties/code/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== void 0) {
            const _errs3 = errors;
            if (typeof data.message !== "string") {
              validate78.errors = [
                {
                  instancePath: instancePath + "/message",
                  schemaPath: "#/properties/message/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.outcome_unknown !== void 0) {
              const _errs5 = errors;
              if (typeof data.outcome_unknown !== "boolean") {
                validate78.errors = [
                  {
                    instancePath: instancePath + "/outcome_unknown",
                    schemaPath: "#/properties/outcome_unknown/type",
                    keyword: "type",
                    params: { type: "boolean" },
                    message: "must be boolean",
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.receipt !== void 0) {
                let data3 = data.receipt;
                const _errs7 = errors;
                if (typeof data3 !== "string" && data3 !== null) {
                  validate78.errors = [
                    {
                      instancePath: instancePath + "/receipt",
                      schemaPath: "#/properties/receipt/type",
                      keyword: "type",
                      params: { type: schema31.properties.receipt.type },
                      message: "must be string,null",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.request_id !== void 0) {
                  const _errs9 = errors;
                  if (typeof data.request_id !== "string") {
                    validate78.errors = [
                      {
                        instancePath: instancePath + "/request_id",
                        schemaPath: "#/properties/request_id/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.retryable !== void 0) {
                    const _errs11 = errors;
                    if (typeof data.retryable !== "boolean") {
                      validate78.errors = [
                        {
                          instancePath: instancePath + "/retryable",
                          schemaPath: "#/properties/retryable/type",
                          keyword: "type",
                          params: { type: "boolean" },
                          message: "must be boolean",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate78.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate78.errors = vErrors;
  return errors === 0;
}
function validate194(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.error === void 0 && (missing0 = "error")) {
        validate194.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.error !== void 0) {
          if (
            !validate78(data.error, {
              instancePath: instancePath + "/error",
              parentData: data,
              parentDataProperty: "error",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate78.errors
                : vErrors.concat(validate78.errors);
            errors = vErrors.length;
          }
        }
      }
    } else {
      validate194.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate194.errors = vErrors;
  return errors === 0;
}
var frame_input = validate196;
var schema32 = {
  type: "object",
  properties: {
    brs: { type: "boolean", default: false },
    data_hex: {
      type: "string",
      default: "",
      maxLength: 128,
      pattern: "^([0-9A-Fa-f]{2})*$",
    },
    dlc: {
      type: ["integer", "null"],
      format: "uint8",
      maximum: 15,
      minimum: 0,
    },
    extended: { type: "boolean", default: false },
    id: { type: "integer", format: "uint32", maximum: 536870911, minimum: 0 },
    kind: { $ref: "#/definitions/FrameKind" },
  },
  additionalProperties: false,
  allOf: [
    {
      else: { properties: { id: { maximum: 2047 } } },
      if: { properties: { extended: { const: true } }, required: ["extended"] },
    },
    {
      if: {
        properties: { kind: { enum: ["classic_data", "classic_remote"] } },
      },
      then: {
        properties: {
          brs: { const: false },
          data_hex: { maxLength: 16 },
          dlc: { type: ["integer", "null"], maximum: 8 },
        },
      },
    },
    {
      if: { properties: { kind: { const: "classic_remote" } } },
      then: {
        properties: {
          data_hex: { const: "" },
          dlc: { type: "integer", maximum: 8, minimum: 0 },
        },
        required: ["dlc"],
      },
    },
    {
      if: { properties: { kind: { const: "fd_data" } } },
      then: {
        properties: {
          data_hex: {
            pattern:
              "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
          },
        },
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 0 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: { properties: { data_hex: { maxLength: 0, minLength: 0 } } },
    },
    {
      if: {
        properties: {
          dlc: { const: 1 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 2, minLength: 2 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 2 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 4, minLength: 4 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 3 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 6, minLength: 6 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 4 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 8, minLength: 8 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 5 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 10, minLength: 10 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 6 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 12, minLength: 12 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 7 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 14, minLength: 14 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 8 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 16, minLength: 16 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 9 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 24, minLength: 24 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 10 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 32, minLength: 32 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 11 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 40, minLength: 40 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 12 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 48, minLength: 48 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 13 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 64, minLength: 64 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 14 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 96, minLength: 96 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 15 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 128, minLength: 128 } },
        required: ["data_hex"],
      },
    },
  ],
  required: ["kind", "id"],
};
var pattern1 = new RegExp(
  "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
  "u",
);
var pattern2 = new RegExp("^([0-9A-Fa-f]{2})*$", "u");
var schema33 = {
  type: "string",
  enum: ["classic_data", "classic_remote", "fd_data"],
};
function validate82(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate82.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "classic_data" ||
    data === "classic_remote" ||
    data === "fd_data"
  )) {
    validate82.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema33.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate82.errors = vErrors;
  return errors === 0;
}
function validate196(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs1 = errors;
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (data.extended === void 0 && (missing0 = "extended")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.extended !== void 0) {
        if (true !== data.extended) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  if (!_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id !== void 0) {
        let data1 = data.id;
        if (typeof data1 == "number") {
          if (data1 > 2047 || isNaN(data1)) {
            validate196.errors = [
              {
                instancePath: instancePath + "/id",
                schemaPath: "#/allOf/0/else/properties/id/maximum",
                keyword: "maximum",
                params: { comparison: "<=", limit: 2047 },
                message: "must be <= 2047",
              },
            ];
            return false;
          }
        }
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err2 = {
      instancePath,
      schemaPath: "#/allOf/0/if",
      keyword: "if",
      params: { failingKeyword: "else" },
      message: 'must match "else" schema',
    };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
    validate196.errors = vErrors;
    return false;
  }
  var valid0 = _errs1 === errors;
  if (valid0) {
    const _errs7 = errors;
    const _errs8 = errors;
    let valid4 = true;
    const _errs9 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.kind !== void 0) {
        let data2 = data.kind;
        if (!(data2 === "classic_data" || data2 === "classic_remote")) {
          const err3 = {};
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
    }
    var _valid1 = _errs9 === errors;
    errors = _errs8;
    if (vErrors !== null) {
      if (_errs8) {
        vErrors.length = _errs8;
      } else {
        vErrors = null;
      }
    }
    if (_valid1) {
      const _errs11 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.brs !== void 0) {
          const _errs12 = errors;
          if (false !== data.brs) {
            validate196.errors = [
              {
                instancePath: instancePath + "/brs",
                schemaPath: "#/allOf/1/then/properties/brs/const",
                keyword: "const",
                params: { allowedValue: false },
                message: "must be equal to constant",
              },
            ];
            return false;
          }
          var valid6 = _errs12 === errors;
        } else {
          var valid6 = true;
        }
        if (valid6) {
          if (data.data_hex !== void 0) {
            let data4 = data.data_hex;
            const _errs13 = errors;
            if (typeof data4 === "string") {
              if (func2(data4) > 16) {
                validate196.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/1/then/properties/data_hex/maxLength",
                    keyword: "maxLength",
                    params: { limit: 16 },
                    message: "must NOT have more than 16 characters",
                  },
                ];
                return false;
              }
            }
            var valid6 = _errs13 === errors;
          } else {
            var valid6 = true;
          }
          if (valid6) {
            if (data.dlc !== void 0) {
              let data5 = data.dlc;
              const _errs14 = errors;
              if (
                !(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5)) &&
                data5 !== null
              ) {
                validate196.errors = [
                  {
                    instancePath: instancePath + "/dlc",
                    schemaPath: "#/allOf/1/then/properties/dlc/type",
                    keyword: "type",
                    params: {
                      type: schema32.allOf[1].then.properties.dlc.type,
                    },
                    message: "must be integer,null",
                  },
                ];
                return false;
              }
              if (errors === _errs14) {
                if (typeof data5 == "number") {
                  if (data5 > 8 || isNaN(data5)) {
                    validate196.errors = [
                      {
                        instancePath: instancePath + "/dlc",
                        schemaPath: "#/allOf/1/then/properties/dlc/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 8 },
                        message: "must be <= 8",
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid6 = _errs14 === errors;
            } else {
              var valid6 = true;
            }
          }
        }
      }
      var _valid1 = _errs11 === errors;
      valid4 = _valid1;
    }
    if (!valid4) {
      const err4 = {
        instancePath,
        schemaPath: "#/allOf/1/if",
        keyword: "if",
        params: { failingKeyword: "then" },
        message: 'must match "then" schema',
      };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
      validate196.errors = vErrors;
      return false;
    }
    var valid0 = _errs7 === errors;
    if (valid0) {
      const _errs16 = errors;
      const _errs17 = errors;
      let valid7 = true;
      const _errs18 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.kind !== void 0) {
          if ("classic_remote" !== data.kind) {
            const err5 = {};
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
      }
      var _valid2 = _errs18 === errors;
      errors = _errs17;
      if (vErrors !== null) {
        if (_errs17) {
          vErrors.length = _errs17;
        } else {
          vErrors = null;
        }
      }
      if (_valid2) {
        const _errs20 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing1;
          if (data.dlc === void 0 && (missing1 = "dlc")) {
            validate196.errors = [
              {
                instancePath,
                schemaPath: "#/allOf/2/then/required",
                keyword: "required",
                params: { missingProperty: missing1 },
                message: "must have required property '" + missing1 + "'",
              },
            ];
            return false;
          } else {
            if (data.data_hex !== void 0) {
              const _errs21 = errors;
              if ("" !== data.data_hex) {
                validate196.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/2/then/properties/data_hex/const",
                    keyword: "const",
                    params: { allowedValue: "" },
                    message: "must be equal to constant",
                  },
                ];
                return false;
              }
              var valid9 = _errs21 === errors;
            } else {
              var valid9 = true;
            }
            if (valid9) {
              if (data.dlc !== void 0) {
                let data8 = data.dlc;
                const _errs22 = errors;
                if (!(
                  typeof data8 == "number" &&
                  !(data8 % 1) &&
                  !isNaN(data8)
                )) {
                  validate196.errors = [
                    {
                      instancePath: instancePath + "/dlc",
                      schemaPath: "#/allOf/2/then/properties/dlc/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs22) {
                  if (typeof data8 == "number") {
                    if (data8 > 8 || isNaN(data8)) {
                      validate196.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/allOf/2/then/properties/dlc/maximum",
                          keyword: "maximum",
                          params: { comparison: "<=", limit: 8 },
                          message: "must be <= 8",
                        },
                      ];
                      return false;
                    } else {
                      if (data8 < 0 || isNaN(data8)) {
                        validate196.errors = [
                          {
                            instancePath: instancePath + "/dlc",
                            schemaPath: "#/allOf/2/then/properties/dlc/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                }
                var valid9 = _errs22 === errors;
              } else {
                var valid9 = true;
              }
            }
          }
        }
        var _valid2 = _errs20 === errors;
        valid7 = _valid2;
      }
      if (!valid7) {
        const err6 = {
          instancePath,
          schemaPath: "#/allOf/2/if",
          keyword: "if",
          params: { failingKeyword: "then" },
          message: 'must match "then" schema',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
        validate196.errors = vErrors;
        return false;
      }
      var valid0 = _errs16 === errors;
      if (valid0) {
        const _errs24 = errors;
        const _errs25 = errors;
        let valid10 = true;
        const _errs26 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind !== void 0) {
            if ("fd_data" !== data.kind) {
              const err7 = {};
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
        }
        var _valid3 = _errs26 === errors;
        errors = _errs25;
        if (vErrors !== null) {
          if (_errs25) {
            vErrors.length = _errs25;
          } else {
            vErrors = null;
          }
        }
        if (_valid3) {
          const _errs28 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            if (data.data_hex !== void 0) {
              let data10 = data.data_hex;
              if (typeof data10 === "string") {
                if (!pattern1.test(data10)) {
                  validate196.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/allOf/3/then/properties/data_hex/pattern",
                      keyword: "pattern",
                      params: {
                        pattern:
                          "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
                      },
                      message:
                        'must match pattern "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$"',
                    },
                  ];
                  return false;
                }
              }
            }
          }
          var _valid3 = _errs28 === errors;
          valid10 = _valid3;
        }
        if (!valid10) {
          const err8 = {
            instancePath,
            schemaPath: "#/allOf/3/if",
            keyword: "if",
            params: { failingKeyword: "then" },
            message: 'must match "then" schema',
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
          validate196.errors = vErrors;
          return false;
        }
        var valid0 = _errs24 === errors;
        if (valid0) {
          const _errs30 = errors;
          const _errs31 = errors;
          let valid13 = true;
          const _errs32 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            let missing2;
            if (data.dlc === void 0 && (missing2 = "dlc")) {
              const err9 = {};
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            } else {
              if (data.dlc !== void 0) {
                const _errs33 = errors;
                if (0 !== data.dlc) {
                  const err10 = {};
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                var valid14 = _errs33 === errors;
              } else {
                var valid14 = true;
              }
              if (valid14) {
                if (data.kind !== void 0) {
                  let data12 = data.kind;
                  const _errs34 = errors;
                  if (!(data12 === "classic_data" || data12 === "fd_data")) {
                    const err11 = {};
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                  var valid14 = _errs34 === errors;
                } else {
                  var valid14 = true;
                }
              }
            }
          }
          var _valid4 = _errs32 === errors;
          errors = _errs31;
          if (vErrors !== null) {
            if (_errs31) {
              vErrors.length = _errs31;
            } else {
              vErrors = null;
            }
          }
          if (_valid4) {
            const _errs35 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              if (data.data_hex !== void 0) {
                let data13 = data.data_hex;
                if (typeof data13 === "string") {
                  if (func2(data13) > 0) {
                    validate196.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath:
                          "#/allOf/4/then/properties/data_hex/maxLength",
                        keyword: "maxLength",
                        params: { limit: 0 },
                        message: "must NOT have more than 0 characters",
                      },
                    ];
                    return false;
                  } else {
                    if (func2(data13) < 0) {
                      validate196.errors = [
                        {
                          instancePath: instancePath + "/data_hex",
                          schemaPath:
                            "#/allOf/4/then/properties/data_hex/minLength",
                          keyword: "minLength",
                          params: { limit: 0 },
                          message: "must NOT have fewer than 0 characters",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
            }
            var _valid4 = _errs35 === errors;
            valid13 = _valid4;
          }
          if (!valid13) {
            const err12 = {
              instancePath,
              schemaPath: "#/allOf/4/if",
              keyword: "if",
              params: { failingKeyword: "then" },
              message: 'must match "then" schema',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
            validate196.errors = vErrors;
            return false;
          }
          var valid0 = _errs30 === errors;
          if (valid0) {
            const _errs37 = errors;
            const _errs38 = errors;
            let valid16 = true;
            const _errs39 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              let missing3;
              if (data.dlc === void 0 && (missing3 = "dlc")) {
                const err13 = {};
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              } else {
                if (data.dlc !== void 0) {
                  const _errs40 = errors;
                  if (1 !== data.dlc) {
                    const err14 = {};
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                  var valid17 = _errs40 === errors;
                } else {
                  var valid17 = true;
                }
                if (valid17) {
                  if (data.kind !== void 0) {
                    let data15 = data.kind;
                    const _errs41 = errors;
                    if (!(data15 === "classic_data" || data15 === "fd_data")) {
                      const err15 = {};
                      if (vErrors === null) {
                        vErrors = [err15];
                      } else {
                        vErrors.push(err15);
                      }
                      errors++;
                    }
                    var valid17 = _errs41 === errors;
                  } else {
                    var valid17 = true;
                  }
                }
              }
            }
            var _valid5 = _errs39 === errors;
            errors = _errs38;
            if (vErrors !== null) {
              if (_errs38) {
                vErrors.length = _errs38;
              } else {
                vErrors = null;
              }
            }
            if (_valid5) {
              const _errs42 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing4;
                if (data.data_hex === void 0 && (missing4 = "data_hex")) {
                  validate196.errors = [
                    {
                      instancePath,
                      schemaPath: "#/allOf/5/then/required",
                      keyword: "required",
                      params: { missingProperty: missing4 },
                      message: "must have required property '" + missing4 + "'",
                    },
                  ];
                  return false;
                } else {
                  if (data.data_hex !== void 0) {
                    let data16 = data.data_hex;
                    if (typeof data16 === "string") {
                      if (func2(data16) > 2) {
                        validate196.errors = [
                          {
                            instancePath: instancePath + "/data_hex",
                            schemaPath:
                              "#/allOf/5/then/properties/data_hex/maxLength",
                            keyword: "maxLength",
                            params: { limit: 2 },
                            message: "must NOT have more than 2 characters",
                          },
                        ];
                        return false;
                      } else {
                        if (func2(data16) < 2) {
                          validate196.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/5/then/properties/data_hex/minLength",
                              keyword: "minLength",
                              params: { limit: 2 },
                              message: "must NOT have fewer than 2 characters",
                            },
                          ];
                          return false;
                        }
                      }
                    }
                  }
                }
              }
              var _valid5 = _errs42 === errors;
              valid16 = _valid5;
            }
            if (!valid16) {
              const err16 = {
                instancePath,
                schemaPath: "#/allOf/5/if",
                keyword: "if",
                params: { failingKeyword: "then" },
                message: 'must match "then" schema',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
              validate196.errors = vErrors;
              return false;
            }
            var valid0 = _errs37 === errors;
            if (valid0) {
              const _errs44 = errors;
              const _errs45 = errors;
              let valid19 = true;
              const _errs46 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing5;
                if (data.dlc === void 0 && (missing5 = "dlc")) {
                  const err17 = {};
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                } else {
                  if (data.dlc !== void 0) {
                    const _errs47 = errors;
                    if (2 !== data.dlc) {
                      const err18 = {};
                      if (vErrors === null) {
                        vErrors = [err18];
                      } else {
                        vErrors.push(err18);
                      }
                      errors++;
                    }
                    var valid20 = _errs47 === errors;
                  } else {
                    var valid20 = true;
                  }
                  if (valid20) {
                    if (data.kind !== void 0) {
                      let data18 = data.kind;
                      const _errs48 = errors;
                      if (!(
                        data18 === "classic_data" || data18 === "fd_data"
                      )) {
                        const err19 = {};
                        if (vErrors === null) {
                          vErrors = [err19];
                        } else {
                          vErrors.push(err19);
                        }
                        errors++;
                      }
                      var valid20 = _errs48 === errors;
                    } else {
                      var valid20 = true;
                    }
                  }
                }
              }
              var _valid6 = _errs46 === errors;
              errors = _errs45;
              if (vErrors !== null) {
                if (_errs45) {
                  vErrors.length = _errs45;
                } else {
                  vErrors = null;
                }
              }
              if (_valid6) {
                const _errs49 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing6;
                  if (data.data_hex === void 0 && (missing6 = "data_hex")) {
                    validate196.errors = [
                      {
                        instancePath,
                        schemaPath: "#/allOf/6/then/required",
                        keyword: "required",
                        params: { missingProperty: missing6 },
                        message:
                          "must have required property '" + missing6 + "'",
                      },
                    ];
                    return false;
                  } else {
                    if (data.data_hex !== void 0) {
                      let data19 = data.data_hex;
                      if (typeof data19 === "string") {
                        if (func2(data19) > 4) {
                          validate196.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/6/then/properties/data_hex/maxLength",
                              keyword: "maxLength",
                              params: { limit: 4 },
                              message: "must NOT have more than 4 characters",
                            },
                          ];
                          return false;
                        } else {
                          if (func2(data19) < 4) {
                            validate196.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/6/then/properties/data_hex/minLength",
                                keyword: "minLength",
                                params: { limit: 4 },
                                message:
                                  "must NOT have fewer than 4 characters",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                  }
                }
                var _valid6 = _errs49 === errors;
                valid19 = _valid6;
              }
              if (!valid19) {
                const err20 = {
                  instancePath,
                  schemaPath: "#/allOf/6/if",
                  keyword: "if",
                  params: { failingKeyword: "then" },
                  message: 'must match "then" schema',
                };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
                validate196.errors = vErrors;
                return false;
              }
              var valid0 = _errs44 === errors;
              if (valid0) {
                const _errs51 = errors;
                const _errs52 = errors;
                let valid22 = true;
                const _errs53 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing7;
                  if (data.dlc === void 0 && (missing7 = "dlc")) {
                    const err21 = {};
                    if (vErrors === null) {
                      vErrors = [err21];
                    } else {
                      vErrors.push(err21);
                    }
                    errors++;
                  } else {
                    if (data.dlc !== void 0) {
                      const _errs54 = errors;
                      if (3 !== data.dlc) {
                        const err22 = {};
                        if (vErrors === null) {
                          vErrors = [err22];
                        } else {
                          vErrors.push(err22);
                        }
                        errors++;
                      }
                      var valid23 = _errs54 === errors;
                    } else {
                      var valid23 = true;
                    }
                    if (valid23) {
                      if (data.kind !== void 0) {
                        let data21 = data.kind;
                        const _errs55 = errors;
                        if (!(
                          data21 === "classic_data" || data21 === "fd_data"
                        )) {
                          const err23 = {};
                          if (vErrors === null) {
                            vErrors = [err23];
                          } else {
                            vErrors.push(err23);
                          }
                          errors++;
                        }
                        var valid23 = _errs55 === errors;
                      } else {
                        var valid23 = true;
                      }
                    }
                  }
                }
                var _valid7 = _errs53 === errors;
                errors = _errs52;
                if (vErrors !== null) {
                  if (_errs52) {
                    vErrors.length = _errs52;
                  } else {
                    vErrors = null;
                  }
                }
                if (_valid7) {
                  const _errs56 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing8;
                    if (data.data_hex === void 0 && (missing8 = "data_hex")) {
                      validate196.errors = [
                        {
                          instancePath,
                          schemaPath: "#/allOf/7/then/required",
                          keyword: "required",
                          params: { missingProperty: missing8 },
                          message:
                            "must have required property '" + missing8 + "'",
                        },
                      ];
                      return false;
                    } else {
                      if (data.data_hex !== void 0) {
                        let data22 = data.data_hex;
                        if (typeof data22 === "string") {
                          if (func2(data22) > 6) {
                            validate196.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/7/then/properties/data_hex/maxLength",
                                keyword: "maxLength",
                                params: { limit: 6 },
                                message: "must NOT have more than 6 characters",
                              },
                            ];
                            return false;
                          } else {
                            if (func2(data22) < 6) {
                              validate196.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/7/then/properties/data_hex/minLength",
                                  keyword: "minLength",
                                  params: { limit: 6 },
                                  message:
                                    "must NOT have fewer than 6 characters",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                      }
                    }
                  }
                  var _valid7 = _errs56 === errors;
                  valid22 = _valid7;
                }
                if (!valid22) {
                  const err24 = {
                    instancePath,
                    schemaPath: "#/allOf/7/if",
                    keyword: "if",
                    params: { failingKeyword: "then" },
                    message: 'must match "then" schema',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                  validate196.errors = vErrors;
                  return false;
                }
                var valid0 = _errs51 === errors;
                if (valid0) {
                  const _errs58 = errors;
                  const _errs59 = errors;
                  let valid25 = true;
                  const _errs60 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing9;
                    if (data.dlc === void 0 && (missing9 = "dlc")) {
                      const err25 = {};
                      if (vErrors === null) {
                        vErrors = [err25];
                      } else {
                        vErrors.push(err25);
                      }
                      errors++;
                    } else {
                      if (data.dlc !== void 0) {
                        const _errs61 = errors;
                        if (4 !== data.dlc) {
                          const err26 = {};
                          if (vErrors === null) {
                            vErrors = [err26];
                          } else {
                            vErrors.push(err26);
                          }
                          errors++;
                        }
                        var valid26 = _errs61 === errors;
                      } else {
                        var valid26 = true;
                      }
                      if (valid26) {
                        if (data.kind !== void 0) {
                          let data24 = data.kind;
                          const _errs62 = errors;
                          if (!(
                            data24 === "classic_data" || data24 === "fd_data"
                          )) {
                            const err27 = {};
                            if (vErrors === null) {
                              vErrors = [err27];
                            } else {
                              vErrors.push(err27);
                            }
                            errors++;
                          }
                          var valid26 = _errs62 === errors;
                        } else {
                          var valid26 = true;
                        }
                      }
                    }
                  }
                  var _valid8 = _errs60 === errors;
                  errors = _errs59;
                  if (vErrors !== null) {
                    if (_errs59) {
                      vErrors.length = _errs59;
                    } else {
                      vErrors = null;
                    }
                  }
                  if (_valid8) {
                    const _errs63 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing10;
                      if (
                        data.data_hex === void 0 &&
                        (missing10 = "data_hex")
                      ) {
                        validate196.errors = [
                          {
                            instancePath,
                            schemaPath: "#/allOf/8/then/required",
                            keyword: "required",
                            params: { missingProperty: missing10 },
                            message:
                              "must have required property '" + missing10 + "'",
                          },
                        ];
                        return false;
                      } else {
                        if (data.data_hex !== void 0) {
                          let data25 = data.data_hex;
                          if (typeof data25 === "string") {
                            if (func2(data25) > 8) {
                              validate196.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/8/then/properties/data_hex/maxLength",
                                  keyword: "maxLength",
                                  params: { limit: 8 },
                                  message:
                                    "must NOT have more than 8 characters",
                                },
                              ];
                              return false;
                            } else {
                              if (func2(data25) < 8) {
                                validate196.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/8/then/properties/data_hex/minLength",
                                    keyword: "minLength",
                                    params: { limit: 8 },
                                    message:
                                      "must NOT have fewer than 8 characters",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                        }
                      }
                    }
                    var _valid8 = _errs63 === errors;
                    valid25 = _valid8;
                  }
                  if (!valid25) {
                    const err28 = {
                      instancePath,
                      schemaPath: "#/allOf/8/if",
                      keyword: "if",
                      params: { failingKeyword: "then" },
                      message: 'must match "then" schema',
                    };
                    if (vErrors === null) {
                      vErrors = [err28];
                    } else {
                      vErrors.push(err28);
                    }
                    errors++;
                    validate196.errors = vErrors;
                    return false;
                  }
                  var valid0 = _errs58 === errors;
                  if (valid0) {
                    const _errs65 = errors;
                    const _errs66 = errors;
                    let valid28 = true;
                    const _errs67 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing11;
                      if (data.dlc === void 0 && (missing11 = "dlc")) {
                        const err29 = {};
                        if (vErrors === null) {
                          vErrors = [err29];
                        } else {
                          vErrors.push(err29);
                        }
                        errors++;
                      } else {
                        if (data.dlc !== void 0) {
                          const _errs68 = errors;
                          if (5 !== data.dlc) {
                            const err30 = {};
                            if (vErrors === null) {
                              vErrors = [err30];
                            } else {
                              vErrors.push(err30);
                            }
                            errors++;
                          }
                          var valid29 = _errs68 === errors;
                        } else {
                          var valid29 = true;
                        }
                        if (valid29) {
                          if (data.kind !== void 0) {
                            let data27 = data.kind;
                            const _errs69 = errors;
                            if (!(
                              data27 === "classic_data" || data27 === "fd_data"
                            )) {
                              const err31 = {};
                              if (vErrors === null) {
                                vErrors = [err31];
                              } else {
                                vErrors.push(err31);
                              }
                              errors++;
                            }
                            var valid29 = _errs69 === errors;
                          } else {
                            var valid29 = true;
                          }
                        }
                      }
                    }
                    var _valid9 = _errs67 === errors;
                    errors = _errs66;
                    if (vErrors !== null) {
                      if (_errs66) {
                        vErrors.length = _errs66;
                      } else {
                        vErrors = null;
                      }
                    }
                    if (_valid9) {
                      const _errs70 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing12;
                        if (
                          data.data_hex === void 0 &&
                          (missing12 = "data_hex")
                        ) {
                          validate196.errors = [
                            {
                              instancePath,
                              schemaPath: "#/allOf/9/then/required",
                              keyword: "required",
                              params: { missingProperty: missing12 },
                              message:
                                "must have required property '" +
                                missing12 +
                                "'",
                            },
                          ];
                          return false;
                        } else {
                          if (data.data_hex !== void 0) {
                            let data28 = data.data_hex;
                            if (typeof data28 === "string") {
                              if (func2(data28) > 10) {
                                validate196.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/9/then/properties/data_hex/maxLength",
                                    keyword: "maxLength",
                                    params: { limit: 10 },
                                    message:
                                      "must NOT have more than 10 characters",
                                  },
                                ];
                                return false;
                              } else {
                                if (func2(data28) < 10) {
                                  validate196.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/9/then/properties/data_hex/minLength",
                                      keyword: "minLength",
                                      params: { limit: 10 },
                                      message:
                                        "must NOT have fewer than 10 characters",
                                    },
                                  ];
                                  return false;
                                }
                              }
                            }
                          }
                        }
                      }
                      var _valid9 = _errs70 === errors;
                      valid28 = _valid9;
                    }
                    if (!valid28) {
                      const err32 = {
                        instancePath,
                        schemaPath: "#/allOf/9/if",
                        keyword: "if",
                        params: { failingKeyword: "then" },
                        message: 'must match "then" schema',
                      };
                      if (vErrors === null) {
                        vErrors = [err32];
                      } else {
                        vErrors.push(err32);
                      }
                      errors++;
                      validate196.errors = vErrors;
                      return false;
                    }
                    var valid0 = _errs65 === errors;
                    if (valid0) {
                      const _errs72 = errors;
                      const _errs73 = errors;
                      let valid31 = true;
                      const _errs74 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing13;
                        if (data.dlc === void 0 && (missing13 = "dlc")) {
                          const err33 = {};
                          if (vErrors === null) {
                            vErrors = [err33];
                          } else {
                            vErrors.push(err33);
                          }
                          errors++;
                        } else {
                          if (data.dlc !== void 0) {
                            const _errs75 = errors;
                            if (6 !== data.dlc) {
                              const err34 = {};
                              if (vErrors === null) {
                                vErrors = [err34];
                              } else {
                                vErrors.push(err34);
                              }
                              errors++;
                            }
                            var valid32 = _errs75 === errors;
                          } else {
                            var valid32 = true;
                          }
                          if (valid32) {
                            if (data.kind !== void 0) {
                              let data30 = data.kind;
                              const _errs76 = errors;
                              if (!(
                                data30 === "classic_data" ||
                                data30 === "fd_data"
                              )) {
                                const err35 = {};
                                if (vErrors === null) {
                                  vErrors = [err35];
                                } else {
                                  vErrors.push(err35);
                                }
                                errors++;
                              }
                              var valid32 = _errs76 === errors;
                            } else {
                              var valid32 = true;
                            }
                          }
                        }
                      }
                      var _valid10 = _errs74 === errors;
                      errors = _errs73;
                      if (vErrors !== null) {
                        if (_errs73) {
                          vErrors.length = _errs73;
                        } else {
                          vErrors = null;
                        }
                      }
                      if (_valid10) {
                        const _errs77 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing14;
                          if (
                            data.data_hex === void 0 &&
                            (missing14 = "data_hex")
                          ) {
                            validate196.errors = [
                              {
                                instancePath,
                                schemaPath: "#/allOf/10/then/required",
                                keyword: "required",
                                params: { missingProperty: missing14 },
                                message:
                                  "must have required property '" +
                                  missing14 +
                                  "'",
                              },
                            ];
                            return false;
                          } else {
                            if (data.data_hex !== void 0) {
                              let data31 = data.data_hex;
                              if (typeof data31 === "string") {
                                if (func2(data31) > 12) {
                                  validate196.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/10/then/properties/data_hex/maxLength",
                                      keyword: "maxLength",
                                      params: { limit: 12 },
                                      message:
                                        "must NOT have more than 12 characters",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (func2(data31) < 12) {
                                    validate196.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/10/then/properties/data_hex/minLength",
                                        keyword: "minLength",
                                        params: { limit: 12 },
                                        message:
                                          "must NOT have fewer than 12 characters",
                                      },
                                    ];
                                    return false;
                                  }
                                }
                              }
                            }
                          }
                        }
                        var _valid10 = _errs77 === errors;
                        valid31 = _valid10;
                      }
                      if (!valid31) {
                        const err36 = {
                          instancePath,
                          schemaPath: "#/allOf/10/if",
                          keyword: "if",
                          params: { failingKeyword: "then" },
                          message: 'must match "then" schema',
                        };
                        if (vErrors === null) {
                          vErrors = [err36];
                        } else {
                          vErrors.push(err36);
                        }
                        errors++;
                        validate196.errors = vErrors;
                        return false;
                      }
                      var valid0 = _errs72 === errors;
                      if (valid0) {
                        const _errs79 = errors;
                        const _errs80 = errors;
                        let valid34 = true;
                        const _errs81 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing15;
                          if (data.dlc === void 0 && (missing15 = "dlc")) {
                            const err37 = {};
                            if (vErrors === null) {
                              vErrors = [err37];
                            } else {
                              vErrors.push(err37);
                            }
                            errors++;
                          } else {
                            if (data.dlc !== void 0) {
                              const _errs82 = errors;
                              if (7 !== data.dlc) {
                                const err38 = {};
                                if (vErrors === null) {
                                  vErrors = [err38];
                                } else {
                                  vErrors.push(err38);
                                }
                                errors++;
                              }
                              var valid35 = _errs82 === errors;
                            } else {
                              var valid35 = true;
                            }
                            if (valid35) {
                              if (data.kind !== void 0) {
                                let data33 = data.kind;
                                const _errs83 = errors;
                                if (!(
                                  data33 === "classic_data" ||
                                  data33 === "fd_data"
                                )) {
                                  const err39 = {};
                                  if (vErrors === null) {
                                    vErrors = [err39];
                                  } else {
                                    vErrors.push(err39);
                                  }
                                  errors++;
                                }
                                var valid35 = _errs83 === errors;
                              } else {
                                var valid35 = true;
                              }
                            }
                          }
                        }
                        var _valid11 = _errs81 === errors;
                        errors = _errs80;
                        if (vErrors !== null) {
                          if (_errs80) {
                            vErrors.length = _errs80;
                          } else {
                            vErrors = null;
                          }
                        }
                        if (_valid11) {
                          const _errs84 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing16;
                            if (
                              data.data_hex === void 0 &&
                              (missing16 = "data_hex")
                            ) {
                              validate196.errors = [
                                {
                                  instancePath,
                                  schemaPath: "#/allOf/11/then/required",
                                  keyword: "required",
                                  params: { missingProperty: missing16 },
                                  message:
                                    "must have required property '" +
                                    missing16 +
                                    "'",
                                },
                              ];
                              return false;
                            } else {
                              if (data.data_hex !== void 0) {
                                let data34 = data.data_hex;
                                if (typeof data34 === "string") {
                                  if (func2(data34) > 14) {
                                    validate196.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/11/then/properties/data_hex/maxLength",
                                        keyword: "maxLength",
                                        params: { limit: 14 },
                                        message:
                                          "must NOT have more than 14 characters",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (func2(data34) < 14) {
                                      validate196.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/11/then/properties/data_hex/minLength",
                                          keyword: "minLength",
                                          params: { limit: 14 },
                                          message:
                                            "must NOT have fewer than 14 characters",
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                }
                              }
                            }
                          }
                          var _valid11 = _errs84 === errors;
                          valid34 = _valid11;
                        }
                        if (!valid34) {
                          const err40 = {
                            instancePath,
                            schemaPath: "#/allOf/11/if",
                            keyword: "if",
                            params: { failingKeyword: "then" },
                            message: 'must match "then" schema',
                          };
                          if (vErrors === null) {
                            vErrors = [err40];
                          } else {
                            vErrors.push(err40);
                          }
                          errors++;
                          validate196.errors = vErrors;
                          return false;
                        }
                        var valid0 = _errs79 === errors;
                        if (valid0) {
                          const _errs86 = errors;
                          const _errs87 = errors;
                          let valid37 = true;
                          const _errs88 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing17;
                            if (data.dlc === void 0 && (missing17 = "dlc")) {
                              const err41 = {};
                              if (vErrors === null) {
                                vErrors = [err41];
                              } else {
                                vErrors.push(err41);
                              }
                              errors++;
                            } else {
                              if (data.dlc !== void 0) {
                                const _errs89 = errors;
                                if (8 !== data.dlc) {
                                  const err42 = {};
                                  if (vErrors === null) {
                                    vErrors = [err42];
                                  } else {
                                    vErrors.push(err42);
                                  }
                                  errors++;
                                }
                                var valid38 = _errs89 === errors;
                              } else {
                                var valid38 = true;
                              }
                              if (valid38) {
                                if (data.kind !== void 0) {
                                  let data36 = data.kind;
                                  const _errs90 = errors;
                                  if (!(
                                    data36 === "classic_data" ||
                                    data36 === "fd_data"
                                  )) {
                                    const err43 = {};
                                    if (vErrors === null) {
                                      vErrors = [err43];
                                    } else {
                                      vErrors.push(err43);
                                    }
                                    errors++;
                                  }
                                  var valid38 = _errs90 === errors;
                                } else {
                                  var valid38 = true;
                                }
                              }
                            }
                          }
                          var _valid12 = _errs88 === errors;
                          errors = _errs87;
                          if (vErrors !== null) {
                            if (_errs87) {
                              vErrors.length = _errs87;
                            } else {
                              vErrors = null;
                            }
                          }
                          if (_valid12) {
                            const _errs91 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing18;
                              if (
                                data.data_hex === void 0 &&
                                (missing18 = "data_hex")
                              ) {
                                validate196.errors = [
                                  {
                                    instancePath,
                                    schemaPath: "#/allOf/12/then/required",
                                    keyword: "required",
                                    params: { missingProperty: missing18 },
                                    message:
                                      "must have required property '" +
                                      missing18 +
                                      "'",
                                  },
                                ];
                                return false;
                              } else {
                                if (data.data_hex !== void 0) {
                                  let data37 = data.data_hex;
                                  if (typeof data37 === "string") {
                                    if (func2(data37) > 16) {
                                      validate196.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/12/then/properties/data_hex/maxLength",
                                          keyword: "maxLength",
                                          params: { limit: 16 },
                                          message:
                                            "must NOT have more than 16 characters",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (func2(data37) < 16) {
                                        validate196.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/12/then/properties/data_hex/minLength",
                                            keyword: "minLength",
                                            params: { limit: 16 },
                                            message:
                                              "must NOT have fewer than 16 characters",
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            var _valid12 = _errs91 === errors;
                            valid37 = _valid12;
                          }
                          if (!valid37) {
                            const err44 = {
                              instancePath,
                              schemaPath: "#/allOf/12/if",
                              keyword: "if",
                              params: { failingKeyword: "then" },
                              message: 'must match "then" schema',
                            };
                            if (vErrors === null) {
                              vErrors = [err44];
                            } else {
                              vErrors.push(err44);
                            }
                            errors++;
                            validate196.errors = vErrors;
                            return false;
                          }
                          var valid0 = _errs86 === errors;
                          if (valid0) {
                            const _errs93 = errors;
                            const _errs94 = errors;
                            let valid40 = true;
                            const _errs95 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing19;
                              if (data.dlc === void 0 && (missing19 = "dlc")) {
                                const err45 = {};
                                if (vErrors === null) {
                                  vErrors = [err45];
                                } else {
                                  vErrors.push(err45);
                                }
                                errors++;
                              } else {
                                if (data.dlc !== void 0) {
                                  const _errs96 = errors;
                                  if (9 !== data.dlc) {
                                    const err46 = {};
                                    if (vErrors === null) {
                                      vErrors = [err46];
                                    } else {
                                      vErrors.push(err46);
                                    }
                                    errors++;
                                  }
                                  var valid41 = _errs96 === errors;
                                } else {
                                  var valid41 = true;
                                }
                                if (valid41) {
                                  if (data.kind !== void 0) {
                                    let data39 = data.kind;
                                    const _errs97 = errors;
                                    if (!(
                                      data39 === "classic_data" ||
                                      data39 === "fd_data"
                                    )) {
                                      const err47 = {};
                                      if (vErrors === null) {
                                        vErrors = [err47];
                                      } else {
                                        vErrors.push(err47);
                                      }
                                      errors++;
                                    }
                                    var valid41 = _errs97 === errors;
                                  } else {
                                    var valid41 = true;
                                  }
                                }
                              }
                            }
                            var _valid13 = _errs95 === errors;
                            errors = _errs94;
                            if (vErrors !== null) {
                              if (_errs94) {
                                vErrors.length = _errs94;
                              } else {
                                vErrors = null;
                              }
                            }
                            if (_valid13) {
                              const _errs98 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing20;
                                if (
                                  data.data_hex === void 0 &&
                                  (missing20 = "data_hex")
                                ) {
                                  validate196.errors = [
                                    {
                                      instancePath,
                                      schemaPath: "#/allOf/13/then/required",
                                      keyword: "required",
                                      params: { missingProperty: missing20 },
                                      message:
                                        "must have required property '" +
                                        missing20 +
                                        "'",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (data.data_hex !== void 0) {
                                    let data40 = data.data_hex;
                                    if (typeof data40 === "string") {
                                      if (func2(data40) > 24) {
                                        validate196.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/13/then/properties/data_hex/maxLength",
                                            keyword: "maxLength",
                                            params: { limit: 24 },
                                            message:
                                              "must NOT have more than 24 characters",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (func2(data40) < 24) {
                                          validate196.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/13/then/properties/data_hex/minLength",
                                              keyword: "minLength",
                                              params: { limit: 24 },
                                              message:
                                                "must NOT have fewer than 24 characters",
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              var _valid13 = _errs98 === errors;
                              valid40 = _valid13;
                            }
                            if (!valid40) {
                              const err48 = {
                                instancePath,
                                schemaPath: "#/allOf/13/if",
                                keyword: "if",
                                params: { failingKeyword: "then" },
                                message: 'must match "then" schema',
                              };
                              if (vErrors === null) {
                                vErrors = [err48];
                              } else {
                                vErrors.push(err48);
                              }
                              errors++;
                              validate196.errors = vErrors;
                              return false;
                            }
                            var valid0 = _errs93 === errors;
                            if (valid0) {
                              const _errs100 = errors;
                              const _errs101 = errors;
                              let valid43 = true;
                              const _errs102 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing21;
                                if (
                                  data.dlc === void 0 &&
                                  (missing21 = "dlc")
                                ) {
                                  const err49 = {};
                                  if (vErrors === null) {
                                    vErrors = [err49];
                                  } else {
                                    vErrors.push(err49);
                                  }
                                  errors++;
                                } else {
                                  if (data.dlc !== void 0) {
                                    const _errs103 = errors;
                                    if (10 !== data.dlc) {
                                      const err50 = {};
                                      if (vErrors === null) {
                                        vErrors = [err50];
                                      } else {
                                        vErrors.push(err50);
                                      }
                                      errors++;
                                    }
                                    var valid44 = _errs103 === errors;
                                  } else {
                                    var valid44 = true;
                                  }
                                  if (valid44) {
                                    if (data.kind !== void 0) {
                                      let data42 = data.kind;
                                      const _errs104 = errors;
                                      if (!(
                                        data42 === "classic_data" ||
                                        data42 === "fd_data"
                                      )) {
                                        const err51 = {};
                                        if (vErrors === null) {
                                          vErrors = [err51];
                                        } else {
                                          vErrors.push(err51);
                                        }
                                        errors++;
                                      }
                                      var valid44 = _errs104 === errors;
                                    } else {
                                      var valid44 = true;
                                    }
                                  }
                                }
                              }
                              var _valid14 = _errs102 === errors;
                              errors = _errs101;
                              if (vErrors !== null) {
                                if (_errs101) {
                                  vErrors.length = _errs101;
                                } else {
                                  vErrors = null;
                                }
                              }
                              if (_valid14) {
                                const _errs105 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing22;
                                  if (
                                    data.data_hex === void 0 &&
                                    (missing22 = "data_hex")
                                  ) {
                                    validate196.errors = [
                                      {
                                        instancePath,
                                        schemaPath: "#/allOf/14/then/required",
                                        keyword: "required",
                                        params: { missingProperty: missing22 },
                                        message:
                                          "must have required property '" +
                                          missing22 +
                                          "'",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (data.data_hex !== void 0) {
                                      let data43 = data.data_hex;
                                      if (typeof data43 === "string") {
                                        if (func2(data43) > 32) {
                                          validate196.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/14/then/properties/data_hex/maxLength",
                                              keyword: "maxLength",
                                              params: { limit: 32 },
                                              message:
                                                "must NOT have more than 32 characters",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (func2(data43) < 32) {
                                            validate196.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/14/then/properties/data_hex/minLength",
                                                keyword: "minLength",
                                                params: { limit: 32 },
                                                message:
                                                  "must NOT have fewer than 32 characters",
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                var _valid14 = _errs105 === errors;
                                valid43 = _valid14;
                              }
                              if (!valid43) {
                                const err52 = {
                                  instancePath,
                                  schemaPath: "#/allOf/14/if",
                                  keyword: "if",
                                  params: { failingKeyword: "then" },
                                  message: 'must match "then" schema',
                                };
                                if (vErrors === null) {
                                  vErrors = [err52];
                                } else {
                                  vErrors.push(err52);
                                }
                                errors++;
                                validate196.errors = vErrors;
                                return false;
                              }
                              var valid0 = _errs100 === errors;
                              if (valid0) {
                                const _errs107 = errors;
                                const _errs108 = errors;
                                let valid46 = true;
                                const _errs109 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing23;
                                  if (
                                    data.dlc === void 0 &&
                                    (missing23 = "dlc")
                                  ) {
                                    const err53 = {};
                                    if (vErrors === null) {
                                      vErrors = [err53];
                                    } else {
                                      vErrors.push(err53);
                                    }
                                    errors++;
                                  } else {
                                    if (data.dlc !== void 0) {
                                      const _errs110 = errors;
                                      if (11 !== data.dlc) {
                                        const err54 = {};
                                        if (vErrors === null) {
                                          vErrors = [err54];
                                        } else {
                                          vErrors.push(err54);
                                        }
                                        errors++;
                                      }
                                      var valid47 = _errs110 === errors;
                                    } else {
                                      var valid47 = true;
                                    }
                                    if (valid47) {
                                      if (data.kind !== void 0) {
                                        let data45 = data.kind;
                                        const _errs111 = errors;
                                        if (!(
                                          data45 === "classic_data" ||
                                          data45 === "fd_data"
                                        )) {
                                          const err55 = {};
                                          if (vErrors === null) {
                                            vErrors = [err55];
                                          } else {
                                            vErrors.push(err55);
                                          }
                                          errors++;
                                        }
                                        var valid47 = _errs111 === errors;
                                      } else {
                                        var valid47 = true;
                                      }
                                    }
                                  }
                                }
                                var _valid15 = _errs109 === errors;
                                errors = _errs108;
                                if (vErrors !== null) {
                                  if (_errs108) {
                                    vErrors.length = _errs108;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                                if (_valid15) {
                                  const _errs112 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing24;
                                    if (
                                      data.data_hex === void 0 &&
                                      (missing24 = "data_hex")
                                    ) {
                                      validate196.errors = [
                                        {
                                          instancePath,
                                          schemaPath:
                                            "#/allOf/15/then/required",
                                          keyword: "required",
                                          params: {
                                            missingProperty: missing24,
                                          },
                                          message:
                                            "must have required property '" +
                                            missing24 +
                                            "'",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (data.data_hex !== void 0) {
                                        let data46 = data.data_hex;
                                        if (typeof data46 === "string") {
                                          if (func2(data46) > 40) {
                                            validate196.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/15/then/properties/data_hex/maxLength",
                                                keyword: "maxLength",
                                                params: { limit: 40 },
                                                message:
                                                  "must NOT have more than 40 characters",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (func2(data46) < 40) {
                                              validate196.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/15/then/properties/data_hex/minLength",
                                                  keyword: "minLength",
                                                  params: { limit: 40 },
                                                  message:
                                                    "must NOT have fewer than 40 characters",
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  var _valid15 = _errs112 === errors;
                                  valid46 = _valid15;
                                }
                                if (!valid46) {
                                  const err56 = {
                                    instancePath,
                                    schemaPath: "#/allOf/15/if",
                                    keyword: "if",
                                    params: { failingKeyword: "then" },
                                    message: 'must match "then" schema',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err56];
                                  } else {
                                    vErrors.push(err56);
                                  }
                                  errors++;
                                  validate196.errors = vErrors;
                                  return false;
                                }
                                var valid0 = _errs107 === errors;
                                if (valid0) {
                                  const _errs114 = errors;
                                  const _errs115 = errors;
                                  let valid49 = true;
                                  const _errs116 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing25;
                                    if (
                                      data.dlc === void 0 &&
                                      (missing25 = "dlc")
                                    ) {
                                      const err57 = {};
                                      if (vErrors === null) {
                                        vErrors = [err57];
                                      } else {
                                        vErrors.push(err57);
                                      }
                                      errors++;
                                    } else {
                                      if (data.dlc !== void 0) {
                                        const _errs117 = errors;
                                        if (12 !== data.dlc) {
                                          const err58 = {};
                                          if (vErrors === null) {
                                            vErrors = [err58];
                                          } else {
                                            vErrors.push(err58);
                                          }
                                          errors++;
                                        }
                                        var valid50 = _errs117 === errors;
                                      } else {
                                        var valid50 = true;
                                      }
                                      if (valid50) {
                                        if (data.kind !== void 0) {
                                          let data48 = data.kind;
                                          const _errs118 = errors;
                                          if (!(
                                            data48 === "classic_data" ||
                                            data48 === "fd_data"
                                          )) {
                                            const err59 = {};
                                            if (vErrors === null) {
                                              vErrors = [err59];
                                            } else {
                                              vErrors.push(err59);
                                            }
                                            errors++;
                                          }
                                          var valid50 = _errs118 === errors;
                                        } else {
                                          var valid50 = true;
                                        }
                                      }
                                    }
                                  }
                                  var _valid16 = _errs116 === errors;
                                  errors = _errs115;
                                  if (vErrors !== null) {
                                    if (_errs115) {
                                      vErrors.length = _errs115;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                  if (_valid16) {
                                    const _errs119 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing26;
                                      if (
                                        data.data_hex === void 0 &&
                                        (missing26 = "data_hex")
                                      ) {
                                        validate196.errors = [
                                          {
                                            instancePath,
                                            schemaPath:
                                              "#/allOf/16/then/required",
                                            keyword: "required",
                                            params: {
                                              missingProperty: missing26,
                                            },
                                            message:
                                              "must have required property '" +
                                              missing26 +
                                              "'",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (data.data_hex !== void 0) {
                                          let data49 = data.data_hex;
                                          if (typeof data49 === "string") {
                                            if (func2(data49) > 48) {
                                              validate196.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/16/then/properties/data_hex/maxLength",
                                                  keyword: "maxLength",
                                                  params: { limit: 48 },
                                                  message:
                                                    "must NOT have more than 48 characters",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (func2(data49) < 48) {
                                                validate196.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/16/then/properties/data_hex/minLength",
                                                    keyword: "minLength",
                                                    params: { limit: 48 },
                                                    message:
                                                      "must NOT have fewer than 48 characters",
                                                  },
                                                ];
                                                return false;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                    var _valid16 = _errs119 === errors;
                                    valid49 = _valid16;
                                  }
                                  if (!valid49) {
                                    const err60 = {
                                      instancePath,
                                      schemaPath: "#/allOf/16/if",
                                      keyword: "if",
                                      params: { failingKeyword: "then" },
                                      message: 'must match "then" schema',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err60];
                                    } else {
                                      vErrors.push(err60);
                                    }
                                    errors++;
                                    validate196.errors = vErrors;
                                    return false;
                                  }
                                  var valid0 = _errs114 === errors;
                                  if (valid0) {
                                    const _errs121 = errors;
                                    const _errs122 = errors;
                                    let valid52 = true;
                                    const _errs123 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing27;
                                      if (
                                        data.dlc === void 0 &&
                                        (missing27 = "dlc")
                                      ) {
                                        const err61 = {};
                                        if (vErrors === null) {
                                          vErrors = [err61];
                                        } else {
                                          vErrors.push(err61);
                                        }
                                        errors++;
                                      } else {
                                        if (data.dlc !== void 0) {
                                          const _errs124 = errors;
                                          if (13 !== data.dlc) {
                                            const err62 = {};
                                            if (vErrors === null) {
                                              vErrors = [err62];
                                            } else {
                                              vErrors.push(err62);
                                            }
                                            errors++;
                                          }
                                          var valid53 = _errs124 === errors;
                                        } else {
                                          var valid53 = true;
                                        }
                                        if (valid53) {
                                          if (data.kind !== void 0) {
                                            let data51 = data.kind;
                                            const _errs125 = errors;
                                            if (!(
                                              data51 === "classic_data" ||
                                              data51 === "fd_data"
                                            )) {
                                              const err63 = {};
                                              if (vErrors === null) {
                                                vErrors = [err63];
                                              } else {
                                                vErrors.push(err63);
                                              }
                                              errors++;
                                            }
                                            var valid53 = _errs125 === errors;
                                          } else {
                                            var valid53 = true;
                                          }
                                        }
                                      }
                                    }
                                    var _valid17 = _errs123 === errors;
                                    errors = _errs122;
                                    if (vErrors !== null) {
                                      if (_errs122) {
                                        vErrors.length = _errs122;
                                      } else {
                                        vErrors = null;
                                      }
                                    }
                                    if (_valid17) {
                                      const _errs126 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing28;
                                        if (
                                          data.data_hex === void 0 &&
                                          (missing28 = "data_hex")
                                        ) {
                                          validate196.errors = [
                                            {
                                              instancePath,
                                              schemaPath:
                                                "#/allOf/17/then/required",
                                              keyword: "required",
                                              params: {
                                                missingProperty: missing28,
                                              },
                                              message:
                                                "must have required property '" +
                                                missing28 +
                                                "'",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (data.data_hex !== void 0) {
                                            let data52 = data.data_hex;
                                            if (typeof data52 === "string") {
                                              if (func2(data52) > 64) {
                                                validate196.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/17/then/properties/data_hex/maxLength",
                                                    keyword: "maxLength",
                                                    params: { limit: 64 },
                                                    message:
                                                      "must NOT have more than 64 characters",
                                                  },
                                                ];
                                                return false;
                                              } else {
                                                if (func2(data52) < 64) {
                                                  validate196.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/17/then/properties/data_hex/minLength",
                                                      keyword: "minLength",
                                                      params: { limit: 64 },
                                                      message:
                                                        "must NOT have fewer than 64 characters",
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                      var _valid17 = _errs126 === errors;
                                      valid52 = _valid17;
                                    }
                                    if (!valid52) {
                                      const err64 = {
                                        instancePath,
                                        schemaPath: "#/allOf/17/if",
                                        keyword: "if",
                                        params: { failingKeyword: "then" },
                                        message: 'must match "then" schema',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err64];
                                      } else {
                                        vErrors.push(err64);
                                      }
                                      errors++;
                                      validate196.errors = vErrors;
                                      return false;
                                    }
                                    var valid0 = _errs121 === errors;
                                    if (valid0) {
                                      const _errs128 = errors;
                                      const _errs129 = errors;
                                      let valid55 = true;
                                      const _errs130 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing29;
                                        if (
                                          data.dlc === void 0 &&
                                          (missing29 = "dlc")
                                        ) {
                                          const err65 = {};
                                          if (vErrors === null) {
                                            vErrors = [err65];
                                          } else {
                                            vErrors.push(err65);
                                          }
                                          errors++;
                                        } else {
                                          if (data.dlc !== void 0) {
                                            const _errs131 = errors;
                                            if (14 !== data.dlc) {
                                              const err66 = {};
                                              if (vErrors === null) {
                                                vErrors = [err66];
                                              } else {
                                                vErrors.push(err66);
                                              }
                                              errors++;
                                            }
                                            var valid56 = _errs131 === errors;
                                          } else {
                                            var valid56 = true;
                                          }
                                          if (valid56) {
                                            if (data.kind !== void 0) {
                                              let data54 = data.kind;
                                              const _errs132 = errors;
                                              if (!(
                                                data54 === "classic_data" ||
                                                data54 === "fd_data"
                                              )) {
                                                const err67 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err67];
                                                } else {
                                                  vErrors.push(err67);
                                                }
                                                errors++;
                                              }
                                              var valid56 = _errs132 === errors;
                                            } else {
                                              var valid56 = true;
                                            }
                                          }
                                        }
                                      }
                                      var _valid18 = _errs130 === errors;
                                      errors = _errs129;
                                      if (vErrors !== null) {
                                        if (_errs129) {
                                          vErrors.length = _errs129;
                                        } else {
                                          vErrors = null;
                                        }
                                      }
                                      if (_valid18) {
                                        const _errs133 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing30;
                                          if (
                                            data.data_hex === void 0 &&
                                            (missing30 = "data_hex")
                                          ) {
                                            validate196.errors = [
                                              {
                                                instancePath,
                                                schemaPath:
                                                  "#/allOf/18/then/required",
                                                keyword: "required",
                                                params: {
                                                  missingProperty: missing30,
                                                },
                                                message:
                                                  "must have required property '" +
                                                  missing30 +
                                                  "'",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (data.data_hex !== void 0) {
                                              let data55 = data.data_hex;
                                              if (typeof data55 === "string") {
                                                if (func2(data55) > 96) {
                                                  validate196.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/18/then/properties/data_hex/maxLength",
                                                      keyword: "maxLength",
                                                      params: { limit: 96 },
                                                      message:
                                                        "must NOT have more than 96 characters",
                                                    },
                                                  ];
                                                  return false;
                                                } else {
                                                  if (func2(data55) < 96) {
                                                    validate196.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/18/then/properties/data_hex/minLength",
                                                        keyword: "minLength",
                                                        params: { limit: 96 },
                                                        message:
                                                          "must NOT have fewer than 96 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                        var _valid18 = _errs133 === errors;
                                        valid55 = _valid18;
                                      }
                                      if (!valid55) {
                                        const err68 = {
                                          instancePath,
                                          schemaPath: "#/allOf/18/if",
                                          keyword: "if",
                                          params: { failingKeyword: "then" },
                                          message: 'must match "then" schema',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err68];
                                        } else {
                                          vErrors.push(err68);
                                        }
                                        errors++;
                                        validate196.errors = vErrors;
                                        return false;
                                      }
                                      var valid0 = _errs128 === errors;
                                      if (valid0) {
                                        const _errs135 = errors;
                                        const _errs136 = errors;
                                        let valid58 = true;
                                        const _errs137 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing31;
                                          if (
                                            data.dlc === void 0 &&
                                            (missing31 = "dlc")
                                          ) {
                                            const err69 = {};
                                            if (vErrors === null) {
                                              vErrors = [err69];
                                            } else {
                                              vErrors.push(err69);
                                            }
                                            errors++;
                                          } else {
                                            if (data.dlc !== void 0) {
                                              const _errs138 = errors;
                                              if (15 !== data.dlc) {
                                                const err70 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err70];
                                                } else {
                                                  vErrors.push(err70);
                                                }
                                                errors++;
                                              }
                                              var valid59 = _errs138 === errors;
                                            } else {
                                              var valid59 = true;
                                            }
                                            if (valid59) {
                                              if (data.kind !== void 0) {
                                                let data57 = data.kind;
                                                const _errs139 = errors;
                                                if (!(
                                                  data57 === "classic_data" ||
                                                  data57 === "fd_data"
                                                )) {
                                                  const err71 = {};
                                                  if (vErrors === null) {
                                                    vErrors = [err71];
                                                  } else {
                                                    vErrors.push(err71);
                                                  }
                                                  errors++;
                                                }
                                                var valid59 =
                                                  _errs139 === errors;
                                              } else {
                                                var valid59 = true;
                                              }
                                            }
                                          }
                                        }
                                        var _valid19 = _errs137 === errors;
                                        errors = _errs136;
                                        if (vErrors !== null) {
                                          if (_errs136) {
                                            vErrors.length = _errs136;
                                          } else {
                                            vErrors = null;
                                          }
                                        }
                                        if (_valid19) {
                                          const _errs140 = errors;
                                          if (
                                            data &&
                                            typeof data == "object" &&
                                            !Array.isArray(data)
                                          ) {
                                            let missing32;
                                            if (
                                              data.data_hex === void 0 &&
                                              (missing32 = "data_hex")
                                            ) {
                                              validate196.errors = [
                                                {
                                                  instancePath,
                                                  schemaPath:
                                                    "#/allOf/19/then/required",
                                                  keyword: "required",
                                                  params: {
                                                    missingProperty: missing32,
                                                  },
                                                  message:
                                                    "must have required property '" +
                                                    missing32 +
                                                    "'",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (data.data_hex !== void 0) {
                                                let data58 = data.data_hex;
                                                if (
                                                  typeof data58 === "string"
                                                ) {
                                                  if (func2(data58) > 128) {
                                                    validate196.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/19/then/properties/data_hex/maxLength",
                                                        keyword: "maxLength",
                                                        params: { limit: 128 },
                                                        message:
                                                          "must NOT have more than 128 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  } else {
                                                    if (func2(data58) < 128) {
                                                      validate196.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath +
                                                            "/data_hex",
                                                          schemaPath:
                                                            "#/allOf/19/then/properties/data_hex/minLength",
                                                          keyword: "minLength",
                                                          params: {
                                                            limit: 128,
                                                          },
                                                          message:
                                                            "must NOT have fewer than 128 characters",
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                          var _valid19 = _errs140 === errors;
                                          valid58 = _valid19;
                                        }
                                        if (!valid58) {
                                          const err72 = {
                                            instancePath,
                                            schemaPath: "#/allOf/19/if",
                                            keyword: "if",
                                            params: { failingKeyword: "then" },
                                            message: 'must match "then" schema',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err72];
                                          } else {
                                            vErrors.push(err72);
                                          }
                                          errors++;
                                          validate196.errors = vErrors;
                                          return false;
                                        }
                                        var valid0 = _errs135 === errors;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing33;
      if (
        (data.kind === void 0 && (missing33 = "kind")) ||
        (data.id === void 0 && (missing33 = "id"))
      ) {
        validate196.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing33 },
            message: "must have required property '" + missing33 + "'",
          },
        ];
        return false;
      } else {
        const _errs142 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "brs" ||
            key0 === "data_hex" ||
            key0 === "dlc" ||
            key0 === "extended" ||
            key0 === "id" ||
            key0 === "kind"
          )) {
            validate196.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs142 === errors) {
          if (data.brs !== void 0) {
            const _errs143 = errors;
            if (typeof data.brs !== "boolean") {
              validate196.errors = [
                {
                  instancePath: instancePath + "/brs",
                  schemaPath: "#/properties/brs/type",
                  keyword: "type",
                  params: { type: "boolean" },
                  message: "must be boolean",
                },
              ];
              return false;
            }
            var valid61 = _errs143 === errors;
          } else {
            var valid61 = true;
          }
          if (valid61) {
            if (data.data_hex !== void 0) {
              let data60 = data.data_hex;
              const _errs145 = errors;
              if (errors === _errs145) {
                if (typeof data60 === "string") {
                  if (func2(data60) > 128) {
                    validate196.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath: "#/properties/data_hex/maxLength",
                        keyword: "maxLength",
                        params: { limit: 128 },
                        message: "must NOT have more than 128 characters",
                      },
                    ];
                    return false;
                  } else {
                    if (!pattern2.test(data60)) {
                      validate196.errors = [
                        {
                          instancePath: instancePath + "/data_hex",
                          schemaPath: "#/properties/data_hex/pattern",
                          keyword: "pattern",
                          params: { pattern: "^([0-9A-Fa-f]{2})*$" },
                          message: 'must match pattern "^([0-9A-Fa-f]{2})*$"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate196.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/properties/data_hex/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
              }
              var valid61 = _errs145 === errors;
            } else {
              var valid61 = true;
            }
            if (valid61) {
              if (data.dlc !== void 0) {
                let data61 = data.dlc;
                const _errs147 = errors;
                if (
                  !(
                    typeof data61 == "number" &&
                    !(data61 % 1) &&
                    !isNaN(data61)
                  ) &&
                  data61 !== null
                ) {
                  validate196.errors = [
                    {
                      instancePath: instancePath + "/dlc",
                      schemaPath: "#/properties/dlc/type",
                      keyword: "type",
                      params: { type: schema32.properties.dlc.type },
                      message: "must be integer,null",
                    },
                  ];
                  return false;
                }
                if (errors === _errs147) {
                  if (typeof data61 == "number") {
                    if (data61 > 15 || isNaN(data61)) {
                      validate196.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/properties/dlc/maximum",
                          keyword: "maximum",
                          params: { comparison: "<=", limit: 15 },
                          message: "must be <= 15",
                        },
                      ];
                      return false;
                    } else {
                      if (data61 < 0 || isNaN(data61)) {
                        validate196.errors = [
                          {
                            instancePath: instancePath + "/dlc",
                            schemaPath: "#/properties/dlc/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                }
                var valid61 = _errs147 === errors;
              } else {
                var valid61 = true;
              }
              if (valid61) {
                if (data.extended !== void 0) {
                  const _errs149 = errors;
                  if (typeof data.extended !== "boolean") {
                    validate196.errors = [
                      {
                        instancePath: instancePath + "/extended",
                        schemaPath: "#/properties/extended/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid61 = _errs149 === errors;
                } else {
                  var valid61 = true;
                }
                if (valid61) {
                  if (data.id !== void 0) {
                    let data63 = data.id;
                    const _errs151 = errors;
                    if (!(
                      typeof data63 == "number" &&
                      !(data63 % 1) &&
                      !isNaN(data63)
                    )) {
                      validate196.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "integer" },
                          message: "must be integer",
                        },
                      ];
                      return false;
                    }
                    if (errors === _errs151) {
                      if (typeof data63 == "number") {
                        if (data63 > 536870911 || isNaN(data63)) {
                          validate196.errors = [
                            {
                              instancePath: instancePath + "/id",
                              schemaPath: "#/properties/id/maximum",
                              keyword: "maximum",
                              params: { comparison: "<=", limit: 536870911 },
                              message: "must be <= 536870911",
                            },
                          ];
                          return false;
                        } else {
                          if (data63 < 0 || isNaN(data63)) {
                            validate196.errors = [
                              {
                                instancePath: instancePath + "/id",
                                schemaPath: "#/properties/id/minimum",
                                keyword: "minimum",
                                params: { comparison: ">=", limit: 0 },
                                message: "must be >= 0",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                    var valid61 = _errs151 === errors;
                  } else {
                    var valid61 = true;
                  }
                  if (valid61) {
                    if (data.kind !== void 0) {
                      const _errs153 = errors;
                      if (
                        !validate82(data.kind, {
                          instancePath: instancePath + "/kind",
                          parentData: data,
                          parentDataProperty: "kind",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate82.errors
                            : vErrors.concat(validate82.errors);
                        errors = vErrors.length;
                      }
                      var valid61 = _errs153 === errors;
                    } else {
                      var valid61 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate196.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate196.errors = vErrors;
  return errors === 0;
}
var legal = validate198;
var schema34 = {
  type: "object",
  properties: {
    exact_source_archive: { type: ["string", "null"] },
    license: { type: "string" },
    notice: { type: "string" },
    source_url: { type: "string" },
    stage: { type: "string" },
  },
  required: [
    "exact_source_archive",
    "license",
    "notice",
    "source_url",
    "stage",
  ],
};
function validate198(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.exact_source_archive === void 0 &&
          (missing0 = "exact_source_archive")) ||
        (data.license === void 0 && (missing0 = "license")) ||
        (data.notice === void 0 && (missing0 = "notice")) ||
        (data.source_url === void 0 && (missing0 = "source_url")) ||
        (data.stage === void 0 && (missing0 = "stage"))
      ) {
        validate198.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.exact_source_archive !== void 0) {
          let data0 = data.exact_source_archive;
          const _errs1 = errors;
          if (typeof data0 !== "string" && data0 !== null) {
            validate198.errors = [
              {
                instancePath: instancePath + "/exact_source_archive",
                schemaPath: "#/properties/exact_source_archive/type",
                keyword: "type",
                params: { type: schema34.properties.exact_source_archive.type },
                message: "must be string,null",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.license !== void 0) {
            const _errs3 = errors;
            if (typeof data.license !== "string") {
              validate198.errors = [
                {
                  instancePath: instancePath + "/license",
                  schemaPath: "#/properties/license/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.notice !== void 0) {
              const _errs5 = errors;
              if (typeof data.notice !== "string") {
                validate198.errors = [
                  {
                    instancePath: instancePath + "/notice",
                    schemaPath: "#/properties/notice/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.source_url !== void 0) {
                const _errs7 = errors;
                if (typeof data.source_url !== "string") {
                  validate198.errors = [
                    {
                      instancePath: instancePath + "/source_url",
                      schemaPath: "#/properties/source_url/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.stage !== void 0) {
                  const _errs9 = errors;
                  if (typeof data.stage !== "string") {
                    validate198.errors = [
                      {
                        instancePath: instancePath + "/stage",
                        schemaPath: "#/properties/stage/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate198.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate198.errors = vErrors;
  return errors === 0;
}
var pair_link = validate199;
function validate199(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.url === void 0 && (missing0 = "url")) {
        validate199.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.url !== void 0) {
          if (typeof data.url !== "string") {
            validate199.errors = [
              {
                instancePath: instancePath + "/url",
                schemaPath: "#/properties/url/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
        }
      }
    } else {
      validate199.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate199.errors = vErrors;
  return errors === 0;
}
var pair_request = validate200;
function validate200(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.code === void 0 && (missing0 = "code")) {
        validate200.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "code")) {
            validate200.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.code !== void 0) {
            if (typeof data.code !== "string") {
              validate200.errors = [
                {
                  instancePath: instancePath + "/code",
                  schemaPath: "#/properties/code/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate200.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate200.errors = vErrors;
  return errors === 0;
}
var periodic_request = validate201;
function validate81(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs1 = errors;
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (data.extended === void 0 && (missing0 = "extended")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.extended !== void 0) {
        if (true !== data.extended) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  if (!_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id !== void 0) {
        let data1 = data.id;
        if (typeof data1 == "number") {
          if (data1 > 2047 || isNaN(data1)) {
            validate81.errors = [
              {
                instancePath: instancePath + "/id",
                schemaPath: "#/allOf/0/else/properties/id/maximum",
                keyword: "maximum",
                params: { comparison: "<=", limit: 2047 },
                message: "must be <= 2047",
              },
            ];
            return false;
          }
        }
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err2 = {
      instancePath,
      schemaPath: "#/allOf/0/if",
      keyword: "if",
      params: { failingKeyword: "else" },
      message: 'must match "else" schema',
    };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
    validate81.errors = vErrors;
    return false;
  }
  var valid0 = _errs1 === errors;
  if (valid0) {
    const _errs7 = errors;
    const _errs8 = errors;
    let valid4 = true;
    const _errs9 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.kind !== void 0) {
        let data2 = data.kind;
        if (!(data2 === "classic_data" || data2 === "classic_remote")) {
          const err3 = {};
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
    }
    var _valid1 = _errs9 === errors;
    errors = _errs8;
    if (vErrors !== null) {
      if (_errs8) {
        vErrors.length = _errs8;
      } else {
        vErrors = null;
      }
    }
    if (_valid1) {
      const _errs11 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.brs !== void 0) {
          const _errs12 = errors;
          if (false !== data.brs) {
            validate81.errors = [
              {
                instancePath: instancePath + "/brs",
                schemaPath: "#/allOf/1/then/properties/brs/const",
                keyword: "const",
                params: { allowedValue: false },
                message: "must be equal to constant",
              },
            ];
            return false;
          }
          var valid6 = _errs12 === errors;
        } else {
          var valid6 = true;
        }
        if (valid6) {
          if (data.data_hex !== void 0) {
            let data4 = data.data_hex;
            const _errs13 = errors;
            if (typeof data4 === "string") {
              if (func2(data4) > 16) {
                validate81.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/1/then/properties/data_hex/maxLength",
                    keyword: "maxLength",
                    params: { limit: 16 },
                    message: "must NOT have more than 16 characters",
                  },
                ];
                return false;
              }
            }
            var valid6 = _errs13 === errors;
          } else {
            var valid6 = true;
          }
          if (valid6) {
            if (data.dlc !== void 0) {
              let data5 = data.dlc;
              const _errs14 = errors;
              if (
                !(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5)) &&
                data5 !== null
              ) {
                validate81.errors = [
                  {
                    instancePath: instancePath + "/dlc",
                    schemaPath: "#/allOf/1/then/properties/dlc/type",
                    keyword: "type",
                    params: {
                      type: schema32.allOf[1].then.properties.dlc.type,
                    },
                    message: "must be integer,null",
                  },
                ];
                return false;
              }
              if (errors === _errs14) {
                if (typeof data5 == "number") {
                  if (data5 > 8 || isNaN(data5)) {
                    validate81.errors = [
                      {
                        instancePath: instancePath + "/dlc",
                        schemaPath: "#/allOf/1/then/properties/dlc/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 8 },
                        message: "must be <= 8",
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid6 = _errs14 === errors;
            } else {
              var valid6 = true;
            }
          }
        }
      }
      var _valid1 = _errs11 === errors;
      valid4 = _valid1;
    }
    if (!valid4) {
      const err4 = {
        instancePath,
        schemaPath: "#/allOf/1/if",
        keyword: "if",
        params: { failingKeyword: "then" },
        message: 'must match "then" schema',
      };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
      validate81.errors = vErrors;
      return false;
    }
    var valid0 = _errs7 === errors;
    if (valid0) {
      const _errs16 = errors;
      const _errs17 = errors;
      let valid7 = true;
      const _errs18 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.kind !== void 0) {
          if ("classic_remote" !== data.kind) {
            const err5 = {};
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
      }
      var _valid2 = _errs18 === errors;
      errors = _errs17;
      if (vErrors !== null) {
        if (_errs17) {
          vErrors.length = _errs17;
        } else {
          vErrors = null;
        }
      }
      if (_valid2) {
        const _errs20 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing1;
          if (data.dlc === void 0 && (missing1 = "dlc")) {
            validate81.errors = [
              {
                instancePath,
                schemaPath: "#/allOf/2/then/required",
                keyword: "required",
                params: { missingProperty: missing1 },
                message: "must have required property '" + missing1 + "'",
              },
            ];
            return false;
          } else {
            if (data.data_hex !== void 0) {
              const _errs21 = errors;
              if ("" !== data.data_hex) {
                validate81.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/2/then/properties/data_hex/const",
                    keyword: "const",
                    params: { allowedValue: "" },
                    message: "must be equal to constant",
                  },
                ];
                return false;
              }
              var valid9 = _errs21 === errors;
            } else {
              var valid9 = true;
            }
            if (valid9) {
              if (data.dlc !== void 0) {
                let data8 = data.dlc;
                const _errs22 = errors;
                if (!(
                  typeof data8 == "number" &&
                  !(data8 % 1) &&
                  !isNaN(data8)
                )) {
                  validate81.errors = [
                    {
                      instancePath: instancePath + "/dlc",
                      schemaPath: "#/allOf/2/then/properties/dlc/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs22) {
                  if (typeof data8 == "number") {
                    if (data8 > 8 || isNaN(data8)) {
                      validate81.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/allOf/2/then/properties/dlc/maximum",
                          keyword: "maximum",
                          params: { comparison: "<=", limit: 8 },
                          message: "must be <= 8",
                        },
                      ];
                      return false;
                    } else {
                      if (data8 < 0 || isNaN(data8)) {
                        validate81.errors = [
                          {
                            instancePath: instancePath + "/dlc",
                            schemaPath: "#/allOf/2/then/properties/dlc/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                }
                var valid9 = _errs22 === errors;
              } else {
                var valid9 = true;
              }
            }
          }
        }
        var _valid2 = _errs20 === errors;
        valid7 = _valid2;
      }
      if (!valid7) {
        const err6 = {
          instancePath,
          schemaPath: "#/allOf/2/if",
          keyword: "if",
          params: { failingKeyword: "then" },
          message: 'must match "then" schema',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
        validate81.errors = vErrors;
        return false;
      }
      var valid0 = _errs16 === errors;
      if (valid0) {
        const _errs24 = errors;
        const _errs25 = errors;
        let valid10 = true;
        const _errs26 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind !== void 0) {
            if ("fd_data" !== data.kind) {
              const err7 = {};
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
        }
        var _valid3 = _errs26 === errors;
        errors = _errs25;
        if (vErrors !== null) {
          if (_errs25) {
            vErrors.length = _errs25;
          } else {
            vErrors = null;
          }
        }
        if (_valid3) {
          const _errs28 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            if (data.data_hex !== void 0) {
              let data10 = data.data_hex;
              if (typeof data10 === "string") {
                if (!pattern1.test(data10)) {
                  validate81.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/allOf/3/then/properties/data_hex/pattern",
                      keyword: "pattern",
                      params: {
                        pattern:
                          "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
                      },
                      message:
                        'must match pattern "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$"',
                    },
                  ];
                  return false;
                }
              }
            }
          }
          var _valid3 = _errs28 === errors;
          valid10 = _valid3;
        }
        if (!valid10) {
          const err8 = {
            instancePath,
            schemaPath: "#/allOf/3/if",
            keyword: "if",
            params: { failingKeyword: "then" },
            message: 'must match "then" schema',
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
          validate81.errors = vErrors;
          return false;
        }
        var valid0 = _errs24 === errors;
        if (valid0) {
          const _errs30 = errors;
          const _errs31 = errors;
          let valid13 = true;
          const _errs32 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            let missing2;
            if (data.dlc === void 0 && (missing2 = "dlc")) {
              const err9 = {};
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            } else {
              if (data.dlc !== void 0) {
                const _errs33 = errors;
                if (0 !== data.dlc) {
                  const err10 = {};
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                var valid14 = _errs33 === errors;
              } else {
                var valid14 = true;
              }
              if (valid14) {
                if (data.kind !== void 0) {
                  let data12 = data.kind;
                  const _errs34 = errors;
                  if (!(data12 === "classic_data" || data12 === "fd_data")) {
                    const err11 = {};
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                  var valid14 = _errs34 === errors;
                } else {
                  var valid14 = true;
                }
              }
            }
          }
          var _valid4 = _errs32 === errors;
          errors = _errs31;
          if (vErrors !== null) {
            if (_errs31) {
              vErrors.length = _errs31;
            } else {
              vErrors = null;
            }
          }
          if (_valid4) {
            const _errs35 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              if (data.data_hex !== void 0) {
                let data13 = data.data_hex;
                if (typeof data13 === "string") {
                  if (func2(data13) > 0) {
                    validate81.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath:
                          "#/allOf/4/then/properties/data_hex/maxLength",
                        keyword: "maxLength",
                        params: { limit: 0 },
                        message: "must NOT have more than 0 characters",
                      },
                    ];
                    return false;
                  } else {
                    if (func2(data13) < 0) {
                      validate81.errors = [
                        {
                          instancePath: instancePath + "/data_hex",
                          schemaPath:
                            "#/allOf/4/then/properties/data_hex/minLength",
                          keyword: "minLength",
                          params: { limit: 0 },
                          message: "must NOT have fewer than 0 characters",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
            }
            var _valid4 = _errs35 === errors;
            valid13 = _valid4;
          }
          if (!valid13) {
            const err12 = {
              instancePath,
              schemaPath: "#/allOf/4/if",
              keyword: "if",
              params: { failingKeyword: "then" },
              message: 'must match "then" schema',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
            validate81.errors = vErrors;
            return false;
          }
          var valid0 = _errs30 === errors;
          if (valid0) {
            const _errs37 = errors;
            const _errs38 = errors;
            let valid16 = true;
            const _errs39 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              let missing3;
              if (data.dlc === void 0 && (missing3 = "dlc")) {
                const err13 = {};
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              } else {
                if (data.dlc !== void 0) {
                  const _errs40 = errors;
                  if (1 !== data.dlc) {
                    const err14 = {};
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                  var valid17 = _errs40 === errors;
                } else {
                  var valid17 = true;
                }
                if (valid17) {
                  if (data.kind !== void 0) {
                    let data15 = data.kind;
                    const _errs41 = errors;
                    if (!(data15 === "classic_data" || data15 === "fd_data")) {
                      const err15 = {};
                      if (vErrors === null) {
                        vErrors = [err15];
                      } else {
                        vErrors.push(err15);
                      }
                      errors++;
                    }
                    var valid17 = _errs41 === errors;
                  } else {
                    var valid17 = true;
                  }
                }
              }
            }
            var _valid5 = _errs39 === errors;
            errors = _errs38;
            if (vErrors !== null) {
              if (_errs38) {
                vErrors.length = _errs38;
              } else {
                vErrors = null;
              }
            }
            if (_valid5) {
              const _errs42 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing4;
                if (data.data_hex === void 0 && (missing4 = "data_hex")) {
                  validate81.errors = [
                    {
                      instancePath,
                      schemaPath: "#/allOf/5/then/required",
                      keyword: "required",
                      params: { missingProperty: missing4 },
                      message: "must have required property '" + missing4 + "'",
                    },
                  ];
                  return false;
                } else {
                  if (data.data_hex !== void 0) {
                    let data16 = data.data_hex;
                    if (typeof data16 === "string") {
                      if (func2(data16) > 2) {
                        validate81.errors = [
                          {
                            instancePath: instancePath + "/data_hex",
                            schemaPath:
                              "#/allOf/5/then/properties/data_hex/maxLength",
                            keyword: "maxLength",
                            params: { limit: 2 },
                            message: "must NOT have more than 2 characters",
                          },
                        ];
                        return false;
                      } else {
                        if (func2(data16) < 2) {
                          validate81.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/5/then/properties/data_hex/minLength",
                              keyword: "minLength",
                              params: { limit: 2 },
                              message: "must NOT have fewer than 2 characters",
                            },
                          ];
                          return false;
                        }
                      }
                    }
                  }
                }
              }
              var _valid5 = _errs42 === errors;
              valid16 = _valid5;
            }
            if (!valid16) {
              const err16 = {
                instancePath,
                schemaPath: "#/allOf/5/if",
                keyword: "if",
                params: { failingKeyword: "then" },
                message: 'must match "then" schema',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
              validate81.errors = vErrors;
              return false;
            }
            var valid0 = _errs37 === errors;
            if (valid0) {
              const _errs44 = errors;
              const _errs45 = errors;
              let valid19 = true;
              const _errs46 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing5;
                if (data.dlc === void 0 && (missing5 = "dlc")) {
                  const err17 = {};
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                } else {
                  if (data.dlc !== void 0) {
                    const _errs47 = errors;
                    if (2 !== data.dlc) {
                      const err18 = {};
                      if (vErrors === null) {
                        vErrors = [err18];
                      } else {
                        vErrors.push(err18);
                      }
                      errors++;
                    }
                    var valid20 = _errs47 === errors;
                  } else {
                    var valid20 = true;
                  }
                  if (valid20) {
                    if (data.kind !== void 0) {
                      let data18 = data.kind;
                      const _errs48 = errors;
                      if (!(
                        data18 === "classic_data" || data18 === "fd_data"
                      )) {
                        const err19 = {};
                        if (vErrors === null) {
                          vErrors = [err19];
                        } else {
                          vErrors.push(err19);
                        }
                        errors++;
                      }
                      var valid20 = _errs48 === errors;
                    } else {
                      var valid20 = true;
                    }
                  }
                }
              }
              var _valid6 = _errs46 === errors;
              errors = _errs45;
              if (vErrors !== null) {
                if (_errs45) {
                  vErrors.length = _errs45;
                } else {
                  vErrors = null;
                }
              }
              if (_valid6) {
                const _errs49 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing6;
                  if (data.data_hex === void 0 && (missing6 = "data_hex")) {
                    validate81.errors = [
                      {
                        instancePath,
                        schemaPath: "#/allOf/6/then/required",
                        keyword: "required",
                        params: { missingProperty: missing6 },
                        message:
                          "must have required property '" + missing6 + "'",
                      },
                    ];
                    return false;
                  } else {
                    if (data.data_hex !== void 0) {
                      let data19 = data.data_hex;
                      if (typeof data19 === "string") {
                        if (func2(data19) > 4) {
                          validate81.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/6/then/properties/data_hex/maxLength",
                              keyword: "maxLength",
                              params: { limit: 4 },
                              message: "must NOT have more than 4 characters",
                            },
                          ];
                          return false;
                        } else {
                          if (func2(data19) < 4) {
                            validate81.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/6/then/properties/data_hex/minLength",
                                keyword: "minLength",
                                params: { limit: 4 },
                                message:
                                  "must NOT have fewer than 4 characters",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                  }
                }
                var _valid6 = _errs49 === errors;
                valid19 = _valid6;
              }
              if (!valid19) {
                const err20 = {
                  instancePath,
                  schemaPath: "#/allOf/6/if",
                  keyword: "if",
                  params: { failingKeyword: "then" },
                  message: 'must match "then" schema',
                };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
                validate81.errors = vErrors;
                return false;
              }
              var valid0 = _errs44 === errors;
              if (valid0) {
                const _errs51 = errors;
                const _errs52 = errors;
                let valid22 = true;
                const _errs53 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing7;
                  if (data.dlc === void 0 && (missing7 = "dlc")) {
                    const err21 = {};
                    if (vErrors === null) {
                      vErrors = [err21];
                    } else {
                      vErrors.push(err21);
                    }
                    errors++;
                  } else {
                    if (data.dlc !== void 0) {
                      const _errs54 = errors;
                      if (3 !== data.dlc) {
                        const err22 = {};
                        if (vErrors === null) {
                          vErrors = [err22];
                        } else {
                          vErrors.push(err22);
                        }
                        errors++;
                      }
                      var valid23 = _errs54 === errors;
                    } else {
                      var valid23 = true;
                    }
                    if (valid23) {
                      if (data.kind !== void 0) {
                        let data21 = data.kind;
                        const _errs55 = errors;
                        if (!(
                          data21 === "classic_data" || data21 === "fd_data"
                        )) {
                          const err23 = {};
                          if (vErrors === null) {
                            vErrors = [err23];
                          } else {
                            vErrors.push(err23);
                          }
                          errors++;
                        }
                        var valid23 = _errs55 === errors;
                      } else {
                        var valid23 = true;
                      }
                    }
                  }
                }
                var _valid7 = _errs53 === errors;
                errors = _errs52;
                if (vErrors !== null) {
                  if (_errs52) {
                    vErrors.length = _errs52;
                  } else {
                    vErrors = null;
                  }
                }
                if (_valid7) {
                  const _errs56 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing8;
                    if (data.data_hex === void 0 && (missing8 = "data_hex")) {
                      validate81.errors = [
                        {
                          instancePath,
                          schemaPath: "#/allOf/7/then/required",
                          keyword: "required",
                          params: { missingProperty: missing8 },
                          message:
                            "must have required property '" + missing8 + "'",
                        },
                      ];
                      return false;
                    } else {
                      if (data.data_hex !== void 0) {
                        let data22 = data.data_hex;
                        if (typeof data22 === "string") {
                          if (func2(data22) > 6) {
                            validate81.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/7/then/properties/data_hex/maxLength",
                                keyword: "maxLength",
                                params: { limit: 6 },
                                message: "must NOT have more than 6 characters",
                              },
                            ];
                            return false;
                          } else {
                            if (func2(data22) < 6) {
                              validate81.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/7/then/properties/data_hex/minLength",
                                  keyword: "minLength",
                                  params: { limit: 6 },
                                  message:
                                    "must NOT have fewer than 6 characters",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                      }
                    }
                  }
                  var _valid7 = _errs56 === errors;
                  valid22 = _valid7;
                }
                if (!valid22) {
                  const err24 = {
                    instancePath,
                    schemaPath: "#/allOf/7/if",
                    keyword: "if",
                    params: { failingKeyword: "then" },
                    message: 'must match "then" schema',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                  validate81.errors = vErrors;
                  return false;
                }
                var valid0 = _errs51 === errors;
                if (valid0) {
                  const _errs58 = errors;
                  const _errs59 = errors;
                  let valid25 = true;
                  const _errs60 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing9;
                    if (data.dlc === void 0 && (missing9 = "dlc")) {
                      const err25 = {};
                      if (vErrors === null) {
                        vErrors = [err25];
                      } else {
                        vErrors.push(err25);
                      }
                      errors++;
                    } else {
                      if (data.dlc !== void 0) {
                        const _errs61 = errors;
                        if (4 !== data.dlc) {
                          const err26 = {};
                          if (vErrors === null) {
                            vErrors = [err26];
                          } else {
                            vErrors.push(err26);
                          }
                          errors++;
                        }
                        var valid26 = _errs61 === errors;
                      } else {
                        var valid26 = true;
                      }
                      if (valid26) {
                        if (data.kind !== void 0) {
                          let data24 = data.kind;
                          const _errs62 = errors;
                          if (!(
                            data24 === "classic_data" || data24 === "fd_data"
                          )) {
                            const err27 = {};
                            if (vErrors === null) {
                              vErrors = [err27];
                            } else {
                              vErrors.push(err27);
                            }
                            errors++;
                          }
                          var valid26 = _errs62 === errors;
                        } else {
                          var valid26 = true;
                        }
                      }
                    }
                  }
                  var _valid8 = _errs60 === errors;
                  errors = _errs59;
                  if (vErrors !== null) {
                    if (_errs59) {
                      vErrors.length = _errs59;
                    } else {
                      vErrors = null;
                    }
                  }
                  if (_valid8) {
                    const _errs63 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing10;
                      if (
                        data.data_hex === void 0 &&
                        (missing10 = "data_hex")
                      ) {
                        validate81.errors = [
                          {
                            instancePath,
                            schemaPath: "#/allOf/8/then/required",
                            keyword: "required",
                            params: { missingProperty: missing10 },
                            message:
                              "must have required property '" + missing10 + "'",
                          },
                        ];
                        return false;
                      } else {
                        if (data.data_hex !== void 0) {
                          let data25 = data.data_hex;
                          if (typeof data25 === "string") {
                            if (func2(data25) > 8) {
                              validate81.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/8/then/properties/data_hex/maxLength",
                                  keyword: "maxLength",
                                  params: { limit: 8 },
                                  message:
                                    "must NOT have more than 8 characters",
                                },
                              ];
                              return false;
                            } else {
                              if (func2(data25) < 8) {
                                validate81.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/8/then/properties/data_hex/minLength",
                                    keyword: "minLength",
                                    params: { limit: 8 },
                                    message:
                                      "must NOT have fewer than 8 characters",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                        }
                      }
                    }
                    var _valid8 = _errs63 === errors;
                    valid25 = _valid8;
                  }
                  if (!valid25) {
                    const err28 = {
                      instancePath,
                      schemaPath: "#/allOf/8/if",
                      keyword: "if",
                      params: { failingKeyword: "then" },
                      message: 'must match "then" schema',
                    };
                    if (vErrors === null) {
                      vErrors = [err28];
                    } else {
                      vErrors.push(err28);
                    }
                    errors++;
                    validate81.errors = vErrors;
                    return false;
                  }
                  var valid0 = _errs58 === errors;
                  if (valid0) {
                    const _errs65 = errors;
                    const _errs66 = errors;
                    let valid28 = true;
                    const _errs67 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing11;
                      if (data.dlc === void 0 && (missing11 = "dlc")) {
                        const err29 = {};
                        if (vErrors === null) {
                          vErrors = [err29];
                        } else {
                          vErrors.push(err29);
                        }
                        errors++;
                      } else {
                        if (data.dlc !== void 0) {
                          const _errs68 = errors;
                          if (5 !== data.dlc) {
                            const err30 = {};
                            if (vErrors === null) {
                              vErrors = [err30];
                            } else {
                              vErrors.push(err30);
                            }
                            errors++;
                          }
                          var valid29 = _errs68 === errors;
                        } else {
                          var valid29 = true;
                        }
                        if (valid29) {
                          if (data.kind !== void 0) {
                            let data27 = data.kind;
                            const _errs69 = errors;
                            if (!(
                              data27 === "classic_data" || data27 === "fd_data"
                            )) {
                              const err31 = {};
                              if (vErrors === null) {
                                vErrors = [err31];
                              } else {
                                vErrors.push(err31);
                              }
                              errors++;
                            }
                            var valid29 = _errs69 === errors;
                          } else {
                            var valid29 = true;
                          }
                        }
                      }
                    }
                    var _valid9 = _errs67 === errors;
                    errors = _errs66;
                    if (vErrors !== null) {
                      if (_errs66) {
                        vErrors.length = _errs66;
                      } else {
                        vErrors = null;
                      }
                    }
                    if (_valid9) {
                      const _errs70 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing12;
                        if (
                          data.data_hex === void 0 &&
                          (missing12 = "data_hex")
                        ) {
                          validate81.errors = [
                            {
                              instancePath,
                              schemaPath: "#/allOf/9/then/required",
                              keyword: "required",
                              params: { missingProperty: missing12 },
                              message:
                                "must have required property '" +
                                missing12 +
                                "'",
                            },
                          ];
                          return false;
                        } else {
                          if (data.data_hex !== void 0) {
                            let data28 = data.data_hex;
                            if (typeof data28 === "string") {
                              if (func2(data28) > 10) {
                                validate81.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/9/then/properties/data_hex/maxLength",
                                    keyword: "maxLength",
                                    params: { limit: 10 },
                                    message:
                                      "must NOT have more than 10 characters",
                                  },
                                ];
                                return false;
                              } else {
                                if (func2(data28) < 10) {
                                  validate81.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/9/then/properties/data_hex/minLength",
                                      keyword: "minLength",
                                      params: { limit: 10 },
                                      message:
                                        "must NOT have fewer than 10 characters",
                                    },
                                  ];
                                  return false;
                                }
                              }
                            }
                          }
                        }
                      }
                      var _valid9 = _errs70 === errors;
                      valid28 = _valid9;
                    }
                    if (!valid28) {
                      const err32 = {
                        instancePath,
                        schemaPath: "#/allOf/9/if",
                        keyword: "if",
                        params: { failingKeyword: "then" },
                        message: 'must match "then" schema',
                      };
                      if (vErrors === null) {
                        vErrors = [err32];
                      } else {
                        vErrors.push(err32);
                      }
                      errors++;
                      validate81.errors = vErrors;
                      return false;
                    }
                    var valid0 = _errs65 === errors;
                    if (valid0) {
                      const _errs72 = errors;
                      const _errs73 = errors;
                      let valid31 = true;
                      const _errs74 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing13;
                        if (data.dlc === void 0 && (missing13 = "dlc")) {
                          const err33 = {};
                          if (vErrors === null) {
                            vErrors = [err33];
                          } else {
                            vErrors.push(err33);
                          }
                          errors++;
                        } else {
                          if (data.dlc !== void 0) {
                            const _errs75 = errors;
                            if (6 !== data.dlc) {
                              const err34 = {};
                              if (vErrors === null) {
                                vErrors = [err34];
                              } else {
                                vErrors.push(err34);
                              }
                              errors++;
                            }
                            var valid32 = _errs75 === errors;
                          } else {
                            var valid32 = true;
                          }
                          if (valid32) {
                            if (data.kind !== void 0) {
                              let data30 = data.kind;
                              const _errs76 = errors;
                              if (!(
                                data30 === "classic_data" ||
                                data30 === "fd_data"
                              )) {
                                const err35 = {};
                                if (vErrors === null) {
                                  vErrors = [err35];
                                } else {
                                  vErrors.push(err35);
                                }
                                errors++;
                              }
                              var valid32 = _errs76 === errors;
                            } else {
                              var valid32 = true;
                            }
                          }
                        }
                      }
                      var _valid10 = _errs74 === errors;
                      errors = _errs73;
                      if (vErrors !== null) {
                        if (_errs73) {
                          vErrors.length = _errs73;
                        } else {
                          vErrors = null;
                        }
                      }
                      if (_valid10) {
                        const _errs77 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing14;
                          if (
                            data.data_hex === void 0 &&
                            (missing14 = "data_hex")
                          ) {
                            validate81.errors = [
                              {
                                instancePath,
                                schemaPath: "#/allOf/10/then/required",
                                keyword: "required",
                                params: { missingProperty: missing14 },
                                message:
                                  "must have required property '" +
                                  missing14 +
                                  "'",
                              },
                            ];
                            return false;
                          } else {
                            if (data.data_hex !== void 0) {
                              let data31 = data.data_hex;
                              if (typeof data31 === "string") {
                                if (func2(data31) > 12) {
                                  validate81.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/10/then/properties/data_hex/maxLength",
                                      keyword: "maxLength",
                                      params: { limit: 12 },
                                      message:
                                        "must NOT have more than 12 characters",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (func2(data31) < 12) {
                                    validate81.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/10/then/properties/data_hex/minLength",
                                        keyword: "minLength",
                                        params: { limit: 12 },
                                        message:
                                          "must NOT have fewer than 12 characters",
                                      },
                                    ];
                                    return false;
                                  }
                                }
                              }
                            }
                          }
                        }
                        var _valid10 = _errs77 === errors;
                        valid31 = _valid10;
                      }
                      if (!valid31) {
                        const err36 = {
                          instancePath,
                          schemaPath: "#/allOf/10/if",
                          keyword: "if",
                          params: { failingKeyword: "then" },
                          message: 'must match "then" schema',
                        };
                        if (vErrors === null) {
                          vErrors = [err36];
                        } else {
                          vErrors.push(err36);
                        }
                        errors++;
                        validate81.errors = vErrors;
                        return false;
                      }
                      var valid0 = _errs72 === errors;
                      if (valid0) {
                        const _errs79 = errors;
                        const _errs80 = errors;
                        let valid34 = true;
                        const _errs81 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing15;
                          if (data.dlc === void 0 && (missing15 = "dlc")) {
                            const err37 = {};
                            if (vErrors === null) {
                              vErrors = [err37];
                            } else {
                              vErrors.push(err37);
                            }
                            errors++;
                          } else {
                            if (data.dlc !== void 0) {
                              const _errs82 = errors;
                              if (7 !== data.dlc) {
                                const err38 = {};
                                if (vErrors === null) {
                                  vErrors = [err38];
                                } else {
                                  vErrors.push(err38);
                                }
                                errors++;
                              }
                              var valid35 = _errs82 === errors;
                            } else {
                              var valid35 = true;
                            }
                            if (valid35) {
                              if (data.kind !== void 0) {
                                let data33 = data.kind;
                                const _errs83 = errors;
                                if (!(
                                  data33 === "classic_data" ||
                                  data33 === "fd_data"
                                )) {
                                  const err39 = {};
                                  if (vErrors === null) {
                                    vErrors = [err39];
                                  } else {
                                    vErrors.push(err39);
                                  }
                                  errors++;
                                }
                                var valid35 = _errs83 === errors;
                              } else {
                                var valid35 = true;
                              }
                            }
                          }
                        }
                        var _valid11 = _errs81 === errors;
                        errors = _errs80;
                        if (vErrors !== null) {
                          if (_errs80) {
                            vErrors.length = _errs80;
                          } else {
                            vErrors = null;
                          }
                        }
                        if (_valid11) {
                          const _errs84 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing16;
                            if (
                              data.data_hex === void 0 &&
                              (missing16 = "data_hex")
                            ) {
                              validate81.errors = [
                                {
                                  instancePath,
                                  schemaPath: "#/allOf/11/then/required",
                                  keyword: "required",
                                  params: { missingProperty: missing16 },
                                  message:
                                    "must have required property '" +
                                    missing16 +
                                    "'",
                                },
                              ];
                              return false;
                            } else {
                              if (data.data_hex !== void 0) {
                                let data34 = data.data_hex;
                                if (typeof data34 === "string") {
                                  if (func2(data34) > 14) {
                                    validate81.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/11/then/properties/data_hex/maxLength",
                                        keyword: "maxLength",
                                        params: { limit: 14 },
                                        message:
                                          "must NOT have more than 14 characters",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (func2(data34) < 14) {
                                      validate81.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/11/then/properties/data_hex/minLength",
                                          keyword: "minLength",
                                          params: { limit: 14 },
                                          message:
                                            "must NOT have fewer than 14 characters",
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                }
                              }
                            }
                          }
                          var _valid11 = _errs84 === errors;
                          valid34 = _valid11;
                        }
                        if (!valid34) {
                          const err40 = {
                            instancePath,
                            schemaPath: "#/allOf/11/if",
                            keyword: "if",
                            params: { failingKeyword: "then" },
                            message: 'must match "then" schema',
                          };
                          if (vErrors === null) {
                            vErrors = [err40];
                          } else {
                            vErrors.push(err40);
                          }
                          errors++;
                          validate81.errors = vErrors;
                          return false;
                        }
                        var valid0 = _errs79 === errors;
                        if (valid0) {
                          const _errs86 = errors;
                          const _errs87 = errors;
                          let valid37 = true;
                          const _errs88 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing17;
                            if (data.dlc === void 0 && (missing17 = "dlc")) {
                              const err41 = {};
                              if (vErrors === null) {
                                vErrors = [err41];
                              } else {
                                vErrors.push(err41);
                              }
                              errors++;
                            } else {
                              if (data.dlc !== void 0) {
                                const _errs89 = errors;
                                if (8 !== data.dlc) {
                                  const err42 = {};
                                  if (vErrors === null) {
                                    vErrors = [err42];
                                  } else {
                                    vErrors.push(err42);
                                  }
                                  errors++;
                                }
                                var valid38 = _errs89 === errors;
                              } else {
                                var valid38 = true;
                              }
                              if (valid38) {
                                if (data.kind !== void 0) {
                                  let data36 = data.kind;
                                  const _errs90 = errors;
                                  if (!(
                                    data36 === "classic_data" ||
                                    data36 === "fd_data"
                                  )) {
                                    const err43 = {};
                                    if (vErrors === null) {
                                      vErrors = [err43];
                                    } else {
                                      vErrors.push(err43);
                                    }
                                    errors++;
                                  }
                                  var valid38 = _errs90 === errors;
                                } else {
                                  var valid38 = true;
                                }
                              }
                            }
                          }
                          var _valid12 = _errs88 === errors;
                          errors = _errs87;
                          if (vErrors !== null) {
                            if (_errs87) {
                              vErrors.length = _errs87;
                            } else {
                              vErrors = null;
                            }
                          }
                          if (_valid12) {
                            const _errs91 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing18;
                              if (
                                data.data_hex === void 0 &&
                                (missing18 = "data_hex")
                              ) {
                                validate81.errors = [
                                  {
                                    instancePath,
                                    schemaPath: "#/allOf/12/then/required",
                                    keyword: "required",
                                    params: { missingProperty: missing18 },
                                    message:
                                      "must have required property '" +
                                      missing18 +
                                      "'",
                                  },
                                ];
                                return false;
                              } else {
                                if (data.data_hex !== void 0) {
                                  let data37 = data.data_hex;
                                  if (typeof data37 === "string") {
                                    if (func2(data37) > 16) {
                                      validate81.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/12/then/properties/data_hex/maxLength",
                                          keyword: "maxLength",
                                          params: { limit: 16 },
                                          message:
                                            "must NOT have more than 16 characters",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (func2(data37) < 16) {
                                        validate81.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/12/then/properties/data_hex/minLength",
                                            keyword: "minLength",
                                            params: { limit: 16 },
                                            message:
                                              "must NOT have fewer than 16 characters",
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            var _valid12 = _errs91 === errors;
                            valid37 = _valid12;
                          }
                          if (!valid37) {
                            const err44 = {
                              instancePath,
                              schemaPath: "#/allOf/12/if",
                              keyword: "if",
                              params: { failingKeyword: "then" },
                              message: 'must match "then" schema',
                            };
                            if (vErrors === null) {
                              vErrors = [err44];
                            } else {
                              vErrors.push(err44);
                            }
                            errors++;
                            validate81.errors = vErrors;
                            return false;
                          }
                          var valid0 = _errs86 === errors;
                          if (valid0) {
                            const _errs93 = errors;
                            const _errs94 = errors;
                            let valid40 = true;
                            const _errs95 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing19;
                              if (data.dlc === void 0 && (missing19 = "dlc")) {
                                const err45 = {};
                                if (vErrors === null) {
                                  vErrors = [err45];
                                } else {
                                  vErrors.push(err45);
                                }
                                errors++;
                              } else {
                                if (data.dlc !== void 0) {
                                  const _errs96 = errors;
                                  if (9 !== data.dlc) {
                                    const err46 = {};
                                    if (vErrors === null) {
                                      vErrors = [err46];
                                    } else {
                                      vErrors.push(err46);
                                    }
                                    errors++;
                                  }
                                  var valid41 = _errs96 === errors;
                                } else {
                                  var valid41 = true;
                                }
                                if (valid41) {
                                  if (data.kind !== void 0) {
                                    let data39 = data.kind;
                                    const _errs97 = errors;
                                    if (!(
                                      data39 === "classic_data" ||
                                      data39 === "fd_data"
                                    )) {
                                      const err47 = {};
                                      if (vErrors === null) {
                                        vErrors = [err47];
                                      } else {
                                        vErrors.push(err47);
                                      }
                                      errors++;
                                    }
                                    var valid41 = _errs97 === errors;
                                  } else {
                                    var valid41 = true;
                                  }
                                }
                              }
                            }
                            var _valid13 = _errs95 === errors;
                            errors = _errs94;
                            if (vErrors !== null) {
                              if (_errs94) {
                                vErrors.length = _errs94;
                              } else {
                                vErrors = null;
                              }
                            }
                            if (_valid13) {
                              const _errs98 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing20;
                                if (
                                  data.data_hex === void 0 &&
                                  (missing20 = "data_hex")
                                ) {
                                  validate81.errors = [
                                    {
                                      instancePath,
                                      schemaPath: "#/allOf/13/then/required",
                                      keyword: "required",
                                      params: { missingProperty: missing20 },
                                      message:
                                        "must have required property '" +
                                        missing20 +
                                        "'",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (data.data_hex !== void 0) {
                                    let data40 = data.data_hex;
                                    if (typeof data40 === "string") {
                                      if (func2(data40) > 24) {
                                        validate81.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/13/then/properties/data_hex/maxLength",
                                            keyword: "maxLength",
                                            params: { limit: 24 },
                                            message:
                                              "must NOT have more than 24 characters",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (func2(data40) < 24) {
                                          validate81.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/13/then/properties/data_hex/minLength",
                                              keyword: "minLength",
                                              params: { limit: 24 },
                                              message:
                                                "must NOT have fewer than 24 characters",
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              var _valid13 = _errs98 === errors;
                              valid40 = _valid13;
                            }
                            if (!valid40) {
                              const err48 = {
                                instancePath,
                                schemaPath: "#/allOf/13/if",
                                keyword: "if",
                                params: { failingKeyword: "then" },
                                message: 'must match "then" schema',
                              };
                              if (vErrors === null) {
                                vErrors = [err48];
                              } else {
                                vErrors.push(err48);
                              }
                              errors++;
                              validate81.errors = vErrors;
                              return false;
                            }
                            var valid0 = _errs93 === errors;
                            if (valid0) {
                              const _errs100 = errors;
                              const _errs101 = errors;
                              let valid43 = true;
                              const _errs102 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing21;
                                if (
                                  data.dlc === void 0 &&
                                  (missing21 = "dlc")
                                ) {
                                  const err49 = {};
                                  if (vErrors === null) {
                                    vErrors = [err49];
                                  } else {
                                    vErrors.push(err49);
                                  }
                                  errors++;
                                } else {
                                  if (data.dlc !== void 0) {
                                    const _errs103 = errors;
                                    if (10 !== data.dlc) {
                                      const err50 = {};
                                      if (vErrors === null) {
                                        vErrors = [err50];
                                      } else {
                                        vErrors.push(err50);
                                      }
                                      errors++;
                                    }
                                    var valid44 = _errs103 === errors;
                                  } else {
                                    var valid44 = true;
                                  }
                                  if (valid44) {
                                    if (data.kind !== void 0) {
                                      let data42 = data.kind;
                                      const _errs104 = errors;
                                      if (!(
                                        data42 === "classic_data" ||
                                        data42 === "fd_data"
                                      )) {
                                        const err51 = {};
                                        if (vErrors === null) {
                                          vErrors = [err51];
                                        } else {
                                          vErrors.push(err51);
                                        }
                                        errors++;
                                      }
                                      var valid44 = _errs104 === errors;
                                    } else {
                                      var valid44 = true;
                                    }
                                  }
                                }
                              }
                              var _valid14 = _errs102 === errors;
                              errors = _errs101;
                              if (vErrors !== null) {
                                if (_errs101) {
                                  vErrors.length = _errs101;
                                } else {
                                  vErrors = null;
                                }
                              }
                              if (_valid14) {
                                const _errs105 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing22;
                                  if (
                                    data.data_hex === void 0 &&
                                    (missing22 = "data_hex")
                                  ) {
                                    validate81.errors = [
                                      {
                                        instancePath,
                                        schemaPath: "#/allOf/14/then/required",
                                        keyword: "required",
                                        params: { missingProperty: missing22 },
                                        message:
                                          "must have required property '" +
                                          missing22 +
                                          "'",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (data.data_hex !== void 0) {
                                      let data43 = data.data_hex;
                                      if (typeof data43 === "string") {
                                        if (func2(data43) > 32) {
                                          validate81.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/14/then/properties/data_hex/maxLength",
                                              keyword: "maxLength",
                                              params: { limit: 32 },
                                              message:
                                                "must NOT have more than 32 characters",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (func2(data43) < 32) {
                                            validate81.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/14/then/properties/data_hex/minLength",
                                                keyword: "minLength",
                                                params: { limit: 32 },
                                                message:
                                                  "must NOT have fewer than 32 characters",
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                var _valid14 = _errs105 === errors;
                                valid43 = _valid14;
                              }
                              if (!valid43) {
                                const err52 = {
                                  instancePath,
                                  schemaPath: "#/allOf/14/if",
                                  keyword: "if",
                                  params: { failingKeyword: "then" },
                                  message: 'must match "then" schema',
                                };
                                if (vErrors === null) {
                                  vErrors = [err52];
                                } else {
                                  vErrors.push(err52);
                                }
                                errors++;
                                validate81.errors = vErrors;
                                return false;
                              }
                              var valid0 = _errs100 === errors;
                              if (valid0) {
                                const _errs107 = errors;
                                const _errs108 = errors;
                                let valid46 = true;
                                const _errs109 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing23;
                                  if (
                                    data.dlc === void 0 &&
                                    (missing23 = "dlc")
                                  ) {
                                    const err53 = {};
                                    if (vErrors === null) {
                                      vErrors = [err53];
                                    } else {
                                      vErrors.push(err53);
                                    }
                                    errors++;
                                  } else {
                                    if (data.dlc !== void 0) {
                                      const _errs110 = errors;
                                      if (11 !== data.dlc) {
                                        const err54 = {};
                                        if (vErrors === null) {
                                          vErrors = [err54];
                                        } else {
                                          vErrors.push(err54);
                                        }
                                        errors++;
                                      }
                                      var valid47 = _errs110 === errors;
                                    } else {
                                      var valid47 = true;
                                    }
                                    if (valid47) {
                                      if (data.kind !== void 0) {
                                        let data45 = data.kind;
                                        const _errs111 = errors;
                                        if (!(
                                          data45 === "classic_data" ||
                                          data45 === "fd_data"
                                        )) {
                                          const err55 = {};
                                          if (vErrors === null) {
                                            vErrors = [err55];
                                          } else {
                                            vErrors.push(err55);
                                          }
                                          errors++;
                                        }
                                        var valid47 = _errs111 === errors;
                                      } else {
                                        var valid47 = true;
                                      }
                                    }
                                  }
                                }
                                var _valid15 = _errs109 === errors;
                                errors = _errs108;
                                if (vErrors !== null) {
                                  if (_errs108) {
                                    vErrors.length = _errs108;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                                if (_valid15) {
                                  const _errs112 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing24;
                                    if (
                                      data.data_hex === void 0 &&
                                      (missing24 = "data_hex")
                                    ) {
                                      validate81.errors = [
                                        {
                                          instancePath,
                                          schemaPath:
                                            "#/allOf/15/then/required",
                                          keyword: "required",
                                          params: {
                                            missingProperty: missing24,
                                          },
                                          message:
                                            "must have required property '" +
                                            missing24 +
                                            "'",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (data.data_hex !== void 0) {
                                        let data46 = data.data_hex;
                                        if (typeof data46 === "string") {
                                          if (func2(data46) > 40) {
                                            validate81.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/15/then/properties/data_hex/maxLength",
                                                keyword: "maxLength",
                                                params: { limit: 40 },
                                                message:
                                                  "must NOT have more than 40 characters",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (func2(data46) < 40) {
                                              validate81.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/15/then/properties/data_hex/minLength",
                                                  keyword: "minLength",
                                                  params: { limit: 40 },
                                                  message:
                                                    "must NOT have fewer than 40 characters",
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  var _valid15 = _errs112 === errors;
                                  valid46 = _valid15;
                                }
                                if (!valid46) {
                                  const err56 = {
                                    instancePath,
                                    schemaPath: "#/allOf/15/if",
                                    keyword: "if",
                                    params: { failingKeyword: "then" },
                                    message: 'must match "then" schema',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err56];
                                  } else {
                                    vErrors.push(err56);
                                  }
                                  errors++;
                                  validate81.errors = vErrors;
                                  return false;
                                }
                                var valid0 = _errs107 === errors;
                                if (valid0) {
                                  const _errs114 = errors;
                                  const _errs115 = errors;
                                  let valid49 = true;
                                  const _errs116 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing25;
                                    if (
                                      data.dlc === void 0 &&
                                      (missing25 = "dlc")
                                    ) {
                                      const err57 = {};
                                      if (vErrors === null) {
                                        vErrors = [err57];
                                      } else {
                                        vErrors.push(err57);
                                      }
                                      errors++;
                                    } else {
                                      if (data.dlc !== void 0) {
                                        const _errs117 = errors;
                                        if (12 !== data.dlc) {
                                          const err58 = {};
                                          if (vErrors === null) {
                                            vErrors = [err58];
                                          } else {
                                            vErrors.push(err58);
                                          }
                                          errors++;
                                        }
                                        var valid50 = _errs117 === errors;
                                      } else {
                                        var valid50 = true;
                                      }
                                      if (valid50) {
                                        if (data.kind !== void 0) {
                                          let data48 = data.kind;
                                          const _errs118 = errors;
                                          if (!(
                                            data48 === "classic_data" ||
                                            data48 === "fd_data"
                                          )) {
                                            const err59 = {};
                                            if (vErrors === null) {
                                              vErrors = [err59];
                                            } else {
                                              vErrors.push(err59);
                                            }
                                            errors++;
                                          }
                                          var valid50 = _errs118 === errors;
                                        } else {
                                          var valid50 = true;
                                        }
                                      }
                                    }
                                  }
                                  var _valid16 = _errs116 === errors;
                                  errors = _errs115;
                                  if (vErrors !== null) {
                                    if (_errs115) {
                                      vErrors.length = _errs115;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                  if (_valid16) {
                                    const _errs119 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing26;
                                      if (
                                        data.data_hex === void 0 &&
                                        (missing26 = "data_hex")
                                      ) {
                                        validate81.errors = [
                                          {
                                            instancePath,
                                            schemaPath:
                                              "#/allOf/16/then/required",
                                            keyword: "required",
                                            params: {
                                              missingProperty: missing26,
                                            },
                                            message:
                                              "must have required property '" +
                                              missing26 +
                                              "'",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (data.data_hex !== void 0) {
                                          let data49 = data.data_hex;
                                          if (typeof data49 === "string") {
                                            if (func2(data49) > 48) {
                                              validate81.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/16/then/properties/data_hex/maxLength",
                                                  keyword: "maxLength",
                                                  params: { limit: 48 },
                                                  message:
                                                    "must NOT have more than 48 characters",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (func2(data49) < 48) {
                                                validate81.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/16/then/properties/data_hex/minLength",
                                                    keyword: "minLength",
                                                    params: { limit: 48 },
                                                    message:
                                                      "must NOT have fewer than 48 characters",
                                                  },
                                                ];
                                                return false;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                    var _valid16 = _errs119 === errors;
                                    valid49 = _valid16;
                                  }
                                  if (!valid49) {
                                    const err60 = {
                                      instancePath,
                                      schemaPath: "#/allOf/16/if",
                                      keyword: "if",
                                      params: { failingKeyword: "then" },
                                      message: 'must match "then" schema',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err60];
                                    } else {
                                      vErrors.push(err60);
                                    }
                                    errors++;
                                    validate81.errors = vErrors;
                                    return false;
                                  }
                                  var valid0 = _errs114 === errors;
                                  if (valid0) {
                                    const _errs121 = errors;
                                    const _errs122 = errors;
                                    let valid52 = true;
                                    const _errs123 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing27;
                                      if (
                                        data.dlc === void 0 &&
                                        (missing27 = "dlc")
                                      ) {
                                        const err61 = {};
                                        if (vErrors === null) {
                                          vErrors = [err61];
                                        } else {
                                          vErrors.push(err61);
                                        }
                                        errors++;
                                      } else {
                                        if (data.dlc !== void 0) {
                                          const _errs124 = errors;
                                          if (13 !== data.dlc) {
                                            const err62 = {};
                                            if (vErrors === null) {
                                              vErrors = [err62];
                                            } else {
                                              vErrors.push(err62);
                                            }
                                            errors++;
                                          }
                                          var valid53 = _errs124 === errors;
                                        } else {
                                          var valid53 = true;
                                        }
                                        if (valid53) {
                                          if (data.kind !== void 0) {
                                            let data51 = data.kind;
                                            const _errs125 = errors;
                                            if (!(
                                              data51 === "classic_data" ||
                                              data51 === "fd_data"
                                            )) {
                                              const err63 = {};
                                              if (vErrors === null) {
                                                vErrors = [err63];
                                              } else {
                                                vErrors.push(err63);
                                              }
                                              errors++;
                                            }
                                            var valid53 = _errs125 === errors;
                                          } else {
                                            var valid53 = true;
                                          }
                                        }
                                      }
                                    }
                                    var _valid17 = _errs123 === errors;
                                    errors = _errs122;
                                    if (vErrors !== null) {
                                      if (_errs122) {
                                        vErrors.length = _errs122;
                                      } else {
                                        vErrors = null;
                                      }
                                    }
                                    if (_valid17) {
                                      const _errs126 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing28;
                                        if (
                                          data.data_hex === void 0 &&
                                          (missing28 = "data_hex")
                                        ) {
                                          validate81.errors = [
                                            {
                                              instancePath,
                                              schemaPath:
                                                "#/allOf/17/then/required",
                                              keyword: "required",
                                              params: {
                                                missingProperty: missing28,
                                              },
                                              message:
                                                "must have required property '" +
                                                missing28 +
                                                "'",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (data.data_hex !== void 0) {
                                            let data52 = data.data_hex;
                                            if (typeof data52 === "string") {
                                              if (func2(data52) > 64) {
                                                validate81.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/17/then/properties/data_hex/maxLength",
                                                    keyword: "maxLength",
                                                    params: { limit: 64 },
                                                    message:
                                                      "must NOT have more than 64 characters",
                                                  },
                                                ];
                                                return false;
                                              } else {
                                                if (func2(data52) < 64) {
                                                  validate81.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/17/then/properties/data_hex/minLength",
                                                      keyword: "minLength",
                                                      params: { limit: 64 },
                                                      message:
                                                        "must NOT have fewer than 64 characters",
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                      var _valid17 = _errs126 === errors;
                                      valid52 = _valid17;
                                    }
                                    if (!valid52) {
                                      const err64 = {
                                        instancePath,
                                        schemaPath: "#/allOf/17/if",
                                        keyword: "if",
                                        params: { failingKeyword: "then" },
                                        message: 'must match "then" schema',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err64];
                                      } else {
                                        vErrors.push(err64);
                                      }
                                      errors++;
                                      validate81.errors = vErrors;
                                      return false;
                                    }
                                    var valid0 = _errs121 === errors;
                                    if (valid0) {
                                      const _errs128 = errors;
                                      const _errs129 = errors;
                                      let valid55 = true;
                                      const _errs130 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing29;
                                        if (
                                          data.dlc === void 0 &&
                                          (missing29 = "dlc")
                                        ) {
                                          const err65 = {};
                                          if (vErrors === null) {
                                            vErrors = [err65];
                                          } else {
                                            vErrors.push(err65);
                                          }
                                          errors++;
                                        } else {
                                          if (data.dlc !== void 0) {
                                            const _errs131 = errors;
                                            if (14 !== data.dlc) {
                                              const err66 = {};
                                              if (vErrors === null) {
                                                vErrors = [err66];
                                              } else {
                                                vErrors.push(err66);
                                              }
                                              errors++;
                                            }
                                            var valid56 = _errs131 === errors;
                                          } else {
                                            var valid56 = true;
                                          }
                                          if (valid56) {
                                            if (data.kind !== void 0) {
                                              let data54 = data.kind;
                                              const _errs132 = errors;
                                              if (!(
                                                data54 === "classic_data" ||
                                                data54 === "fd_data"
                                              )) {
                                                const err67 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err67];
                                                } else {
                                                  vErrors.push(err67);
                                                }
                                                errors++;
                                              }
                                              var valid56 = _errs132 === errors;
                                            } else {
                                              var valid56 = true;
                                            }
                                          }
                                        }
                                      }
                                      var _valid18 = _errs130 === errors;
                                      errors = _errs129;
                                      if (vErrors !== null) {
                                        if (_errs129) {
                                          vErrors.length = _errs129;
                                        } else {
                                          vErrors = null;
                                        }
                                      }
                                      if (_valid18) {
                                        const _errs133 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing30;
                                          if (
                                            data.data_hex === void 0 &&
                                            (missing30 = "data_hex")
                                          ) {
                                            validate81.errors = [
                                              {
                                                instancePath,
                                                schemaPath:
                                                  "#/allOf/18/then/required",
                                                keyword: "required",
                                                params: {
                                                  missingProperty: missing30,
                                                },
                                                message:
                                                  "must have required property '" +
                                                  missing30 +
                                                  "'",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (data.data_hex !== void 0) {
                                              let data55 = data.data_hex;
                                              if (typeof data55 === "string") {
                                                if (func2(data55) > 96) {
                                                  validate81.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/18/then/properties/data_hex/maxLength",
                                                      keyword: "maxLength",
                                                      params: { limit: 96 },
                                                      message:
                                                        "must NOT have more than 96 characters",
                                                    },
                                                  ];
                                                  return false;
                                                } else {
                                                  if (func2(data55) < 96) {
                                                    validate81.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/18/then/properties/data_hex/minLength",
                                                        keyword: "minLength",
                                                        params: { limit: 96 },
                                                        message:
                                                          "must NOT have fewer than 96 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                        var _valid18 = _errs133 === errors;
                                        valid55 = _valid18;
                                      }
                                      if (!valid55) {
                                        const err68 = {
                                          instancePath,
                                          schemaPath: "#/allOf/18/if",
                                          keyword: "if",
                                          params: { failingKeyword: "then" },
                                          message: 'must match "then" schema',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err68];
                                        } else {
                                          vErrors.push(err68);
                                        }
                                        errors++;
                                        validate81.errors = vErrors;
                                        return false;
                                      }
                                      var valid0 = _errs128 === errors;
                                      if (valid0) {
                                        const _errs135 = errors;
                                        const _errs136 = errors;
                                        let valid58 = true;
                                        const _errs137 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing31;
                                          if (
                                            data.dlc === void 0 &&
                                            (missing31 = "dlc")
                                          ) {
                                            const err69 = {};
                                            if (vErrors === null) {
                                              vErrors = [err69];
                                            } else {
                                              vErrors.push(err69);
                                            }
                                            errors++;
                                          } else {
                                            if (data.dlc !== void 0) {
                                              const _errs138 = errors;
                                              if (15 !== data.dlc) {
                                                const err70 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err70];
                                                } else {
                                                  vErrors.push(err70);
                                                }
                                                errors++;
                                              }
                                              var valid59 = _errs138 === errors;
                                            } else {
                                              var valid59 = true;
                                            }
                                            if (valid59) {
                                              if (data.kind !== void 0) {
                                                let data57 = data.kind;
                                                const _errs139 = errors;
                                                if (!(
                                                  data57 === "classic_data" ||
                                                  data57 === "fd_data"
                                                )) {
                                                  const err71 = {};
                                                  if (vErrors === null) {
                                                    vErrors = [err71];
                                                  } else {
                                                    vErrors.push(err71);
                                                  }
                                                  errors++;
                                                }
                                                var valid59 =
                                                  _errs139 === errors;
                                              } else {
                                                var valid59 = true;
                                              }
                                            }
                                          }
                                        }
                                        var _valid19 = _errs137 === errors;
                                        errors = _errs136;
                                        if (vErrors !== null) {
                                          if (_errs136) {
                                            vErrors.length = _errs136;
                                          } else {
                                            vErrors = null;
                                          }
                                        }
                                        if (_valid19) {
                                          const _errs140 = errors;
                                          if (
                                            data &&
                                            typeof data == "object" &&
                                            !Array.isArray(data)
                                          ) {
                                            let missing32;
                                            if (
                                              data.data_hex === void 0 &&
                                              (missing32 = "data_hex")
                                            ) {
                                              validate81.errors = [
                                                {
                                                  instancePath,
                                                  schemaPath:
                                                    "#/allOf/19/then/required",
                                                  keyword: "required",
                                                  params: {
                                                    missingProperty: missing32,
                                                  },
                                                  message:
                                                    "must have required property '" +
                                                    missing32 +
                                                    "'",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (data.data_hex !== void 0) {
                                                let data58 = data.data_hex;
                                                if (
                                                  typeof data58 === "string"
                                                ) {
                                                  if (func2(data58) > 128) {
                                                    validate81.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/19/then/properties/data_hex/maxLength",
                                                        keyword: "maxLength",
                                                        params: { limit: 128 },
                                                        message:
                                                          "must NOT have more than 128 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  } else {
                                                    if (func2(data58) < 128) {
                                                      validate81.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath +
                                                            "/data_hex",
                                                          schemaPath:
                                                            "#/allOf/19/then/properties/data_hex/minLength",
                                                          keyword: "minLength",
                                                          params: {
                                                            limit: 128,
                                                          },
                                                          message:
                                                            "must NOT have fewer than 128 characters",
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                          var _valid19 = _errs140 === errors;
                                          valid58 = _valid19;
                                        }
                                        if (!valid58) {
                                          const err72 = {
                                            instancePath,
                                            schemaPath: "#/allOf/19/if",
                                            keyword: "if",
                                            params: { failingKeyword: "then" },
                                            message: 'must match "then" schema',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err72];
                                          } else {
                                            vErrors.push(err72);
                                          }
                                          errors++;
                                          validate81.errors = vErrors;
                                          return false;
                                        }
                                        var valid0 = _errs135 === errors;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing33;
      if (
        (data.kind === void 0 && (missing33 = "kind")) ||
        (data.id === void 0 && (missing33 = "id"))
      ) {
        validate81.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing33 },
            message: "must have required property '" + missing33 + "'",
          },
        ];
        return false;
      } else {
        const _errs142 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "brs" ||
            key0 === "data_hex" ||
            key0 === "dlc" ||
            key0 === "extended" ||
            key0 === "id" ||
            key0 === "kind"
          )) {
            validate81.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs142 === errors) {
          if (data.brs !== void 0) {
            const _errs143 = errors;
            if (typeof data.brs !== "boolean") {
              validate81.errors = [
                {
                  instancePath: instancePath + "/brs",
                  schemaPath: "#/properties/brs/type",
                  keyword: "type",
                  params: { type: "boolean" },
                  message: "must be boolean",
                },
              ];
              return false;
            }
            var valid61 = _errs143 === errors;
          } else {
            var valid61 = true;
          }
          if (valid61) {
            if (data.data_hex !== void 0) {
              let data60 = data.data_hex;
              const _errs145 = errors;
              if (errors === _errs145) {
                if (typeof data60 === "string") {
                  if (func2(data60) > 128) {
                    validate81.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath: "#/properties/data_hex/maxLength",
                        keyword: "maxLength",
                        params: { limit: 128 },
                        message: "must NOT have more than 128 characters",
                      },
                    ];
                    return false;
                  } else {
                    if (!pattern2.test(data60)) {
                      validate81.errors = [
                        {
                          instancePath: instancePath + "/data_hex",
                          schemaPath: "#/properties/data_hex/pattern",
                          keyword: "pattern",
                          params: { pattern: "^([0-9A-Fa-f]{2})*$" },
                          message: 'must match pattern "^([0-9A-Fa-f]{2})*$"',
                        },
                      ];
                      return false;
                    }
                  }
                } else {
                  validate81.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/properties/data_hex/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
              }
              var valid61 = _errs145 === errors;
            } else {
              var valid61 = true;
            }
            if (valid61) {
              if (data.dlc !== void 0) {
                let data61 = data.dlc;
                const _errs147 = errors;
                if (
                  !(
                    typeof data61 == "number" &&
                    !(data61 % 1) &&
                    !isNaN(data61)
                  ) &&
                  data61 !== null
                ) {
                  validate81.errors = [
                    {
                      instancePath: instancePath + "/dlc",
                      schemaPath: "#/properties/dlc/type",
                      keyword: "type",
                      params: { type: schema32.properties.dlc.type },
                      message: "must be integer,null",
                    },
                  ];
                  return false;
                }
                if (errors === _errs147) {
                  if (typeof data61 == "number") {
                    if (data61 > 15 || isNaN(data61)) {
                      validate81.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/properties/dlc/maximum",
                          keyword: "maximum",
                          params: { comparison: "<=", limit: 15 },
                          message: "must be <= 15",
                        },
                      ];
                      return false;
                    } else {
                      if (data61 < 0 || isNaN(data61)) {
                        validate81.errors = [
                          {
                            instancePath: instancePath + "/dlc",
                            schemaPath: "#/properties/dlc/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                }
                var valid61 = _errs147 === errors;
              } else {
                var valid61 = true;
              }
              if (valid61) {
                if (data.extended !== void 0) {
                  const _errs149 = errors;
                  if (typeof data.extended !== "boolean") {
                    validate81.errors = [
                      {
                        instancePath: instancePath + "/extended",
                        schemaPath: "#/properties/extended/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid61 = _errs149 === errors;
                } else {
                  var valid61 = true;
                }
                if (valid61) {
                  if (data.id !== void 0) {
                    let data63 = data.id;
                    const _errs151 = errors;
                    if (!(
                      typeof data63 == "number" &&
                      !(data63 % 1) &&
                      !isNaN(data63)
                    )) {
                      validate81.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "integer" },
                          message: "must be integer",
                        },
                      ];
                      return false;
                    }
                    if (errors === _errs151) {
                      if (typeof data63 == "number") {
                        if (data63 > 536870911 || isNaN(data63)) {
                          validate81.errors = [
                            {
                              instancePath: instancePath + "/id",
                              schemaPath: "#/properties/id/maximum",
                              keyword: "maximum",
                              params: { comparison: "<=", limit: 536870911 },
                              message: "must be <= 536870911",
                            },
                          ];
                          return false;
                        } else {
                          if (data63 < 0 || isNaN(data63)) {
                            validate81.errors = [
                              {
                                instancePath: instancePath + "/id",
                                schemaPath: "#/properties/id/minimum",
                                keyword: "minimum",
                                params: { comparison: ">=", limit: 0 },
                                message: "must be >= 0",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                    var valid61 = _errs151 === errors;
                  } else {
                    var valid61 = true;
                  }
                  if (valid61) {
                    if (data.kind !== void 0) {
                      const _errs153 = errors;
                      if (
                        !validate82(data.kind, {
                          instancePath: instancePath + "/kind",
                          parentData: data,
                          parentDataProperty: "kind",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate82.errors
                            : vErrors.concat(validate82.errors);
                        errors = vErrors.length;
                      }
                      var valid61 = _errs153 === errors;
                    } else {
                      var valid61 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate81.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate81.errors = vErrors;
  return errors === 0;
}
function validate201(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.client_request_id === void 0 &&
          (missing0 = "client_request_id")) ||
        (data.frame === void 0 && (missing0 = "frame")) ||
        (data.interval_ms === void 0 && (missing0 = "interval_ms")) ||
        (data.count === void 0 && (missing0 = "count"))
      ) {
        validate201.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "client_request_id" ||
            key0 === "count" ||
            key0 === "frame" ||
            key0 === "interval_ms"
          )) {
            validate201.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.client_request_id !== void 0) {
            let data0 = data.client_request_id;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func2(data0) > 128) {
                  validate201.errors = [
                    {
                      instancePath: instancePath + "/client_request_id",
                      schemaPath: "#/properties/client_request_id/maxLength",
                      keyword: "maxLength",
                      params: { limit: 128 },
                      message: "must NOT have more than 128 characters",
                    },
                  ];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate201.errors = [
                      {
                        instancePath: instancePath + "/client_request_id",
                        schemaPath: "#/properties/client_request_id/minLength",
                        keyword: "minLength",
                        params: { limit: 1 },
                        message: "must NOT have fewer than 1 characters",
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate201.errors = [
                  {
                    instancePath: instancePath + "/client_request_id",
                    schemaPath: "#/properties/client_request_id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.count !== void 0) {
              let data1 = data.count;
              const _errs4 = errors;
              if (!(
                typeof data1 == "number" &&
                !(data1 % 1) &&
                !isNaN(data1)
              )) {
                validate201.errors = [
                  {
                    instancePath: instancePath + "/count",
                    schemaPath: "#/properties/count/type",
                    keyword: "type",
                    params: { type: "integer" },
                    message: "must be integer",
                  },
                ];
                return false;
              }
              if (errors === _errs4) {
                if (typeof data1 == "number") {
                  if (data1 > 6e3 || isNaN(data1)) {
                    validate201.errors = [
                      {
                        instancePath: instancePath + "/count",
                        schemaPath: "#/properties/count/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 6e3 },
                        message: "must be <= 6000",
                      },
                    ];
                    return false;
                  } else {
                    if (data1 < 1 || isNaN(data1)) {
                      validate201.errors = [
                        {
                          instancePath: instancePath + "/count",
                          schemaPath: "#/properties/count/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 1 },
                          message: "must be >= 1",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.frame !== void 0) {
                const _errs6 = errors;
                if (
                  !validate81(data.frame, {
                    instancePath: instancePath + "/frame",
                    parentData: data,
                    parentDataProperty: "frame",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate81.errors
                      : vErrors.concat(validate81.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.interval_ms !== void 0) {
                  let data3 = data.interval_ms;
                  const _errs7 = errors;
                  if (!(
                    typeof data3 == "number" &&
                    !(data3 % 1) &&
                    !isNaN(data3)
                  )) {
                    validate201.errors = [
                      {
                        instancePath: instancePath + "/interval_ms",
                        schemaPath: "#/properties/interval_ms/type",
                        keyword: "type",
                        params: { type: "integer" },
                        message: "must be integer",
                      },
                    ];
                    return false;
                  }
                  if (errors === _errs7) {
                    if (typeof data3 == "number") {
                      if (data3 > 6e4 || isNaN(data3)) {
                        validate201.errors = [
                          {
                            instancePath: instancePath + "/interval_ms",
                            schemaPath: "#/properties/interval_ms/maximum",
                            keyword: "maximum",
                            params: { comparison: "<=", limit: 6e4 },
                            message: "must be <= 60000",
                          },
                        ];
                        return false;
                      } else {
                        if (data3 < 10 || isNaN(data3)) {
                          validate201.errors = [
                            {
                              instancePath: instancePath + "/interval_ms",
                              schemaPath: "#/properties/interval_ms/minimum",
                              keyword: "minimum",
                              params: { comparison: ">=", limit: 10 },
                              message: "must be >= 10",
                            },
                          ];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate201.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate201.errors = vErrors;
  return errors === 0;
}
var periodic_task = validate203;
var schema38 = {
  type: "object",
  properties: {
    attempted: { $ref: "#/definitions/Decimal" },
    client_request_id: { type: "string" },
    failed: { $ref: "#/definitions/Decimal" },
    generation: { $ref: "#/definitions/Decimal" },
    id: { type: "string" },
    max_dispatch_lateness_ns: { $ref: "#/definitions/Decimal" },
    planned: { $ref: "#/definitions/Decimal" },
    reason: { type: ["string", "null"] },
    session_id: { type: "string" },
    skipped: { $ref: "#/definitions/Decimal" },
    state: { $ref: "#/definitions/TaskState" },
    submitted: { $ref: "#/definitions/Decimal" },
    total_dispatch_lateness_ns: { $ref: "#/definitions/Decimal" },
    unknown: { $ref: "#/definitions/Decimal" },
  },
  required: [
    "id",
    "session_id",
    "client_request_id",
    "generation",
    "state",
    "planned",
    "attempted",
    "submitted",
    "failed",
    "unknown",
    "skipped",
    "max_dispatch_lateness_ns",
    "total_dispatch_lateness_ns",
  ],
};
var schema39 = {
  type: "string",
  enum: [
    "starting",
    "running",
    "cancelling",
    "completed",
    "cancelled",
    "failed",
    "outcome_unknown",
  ],
};
function validate101(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate101.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "starting" ||
    data === "running" ||
    data === "cancelling" ||
    data === "completed" ||
    data === "cancelled" ||
    data === "failed" ||
    data === "outcome_unknown"
  )) {
    validate101.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema39.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate101.errors = vErrors;
  return errors === 0;
}
function validate203(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.session_id === void 0 && (missing0 = "session_id")) ||
        (data.client_request_id === void 0 &&
          (missing0 = "client_request_id")) ||
        (data.generation === void 0 && (missing0 = "generation")) ||
        (data.state === void 0 && (missing0 = "state")) ||
        (data.planned === void 0 && (missing0 = "planned")) ||
        (data.attempted === void 0 && (missing0 = "attempted")) ||
        (data.submitted === void 0 && (missing0 = "submitted")) ||
        (data.failed === void 0 && (missing0 = "failed")) ||
        (data.unknown === void 0 && (missing0 = "unknown")) ||
        (data.skipped === void 0 && (missing0 = "skipped")) ||
        (data.max_dispatch_lateness_ns === void 0 &&
          (missing0 = "max_dispatch_lateness_ns")) ||
        (data.total_dispatch_lateness_ns === void 0 &&
          (missing0 = "total_dispatch_lateness_ns"))
      ) {
        validate203.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.attempted !== void 0) {
          const _errs1 = errors;
          if (
            !validate30(data.attempted, {
              instancePath: instancePath + "/attempted",
              parentData: data,
              parentDataProperty: "attempted",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate30.errors
                : vErrors.concat(validate30.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.client_request_id !== void 0) {
            const _errs2 = errors;
            if (typeof data.client_request_id !== "string") {
              validate203.errors = [
                {
                  instancePath: instancePath + "/client_request_id",
                  schemaPath: "#/properties/client_request_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.failed !== void 0) {
              const _errs4 = errors;
              if (
                !validate30(data.failed, {
                  instancePath: instancePath + "/failed",
                  parentData: data,
                  parentDataProperty: "failed",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.generation !== void 0) {
                const _errs5 = errors;
                if (
                  !validate30(data.generation, {
                    instancePath: instancePath + "/generation",
                    parentData: data,
                    parentDataProperty: "generation",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate30.errors
                      : vErrors.concat(validate30.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.id !== void 0) {
                  const _errs6 = errors;
                  if (typeof data.id !== "string") {
                    validate203.errors = [
                      {
                        instancePath: instancePath + "/id",
                        schemaPath: "#/properties/id/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.max_dispatch_lateness_ns !== void 0) {
                    const _errs8 = errors;
                    if (
                      !validate30(data.max_dispatch_lateness_ns, {
                        instancePath:
                          instancePath + "/max_dispatch_lateness_ns",
                        parentData: data,
                        parentDataProperty: "max_dispatch_lateness_ns",
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate30.errors
                          : vErrors.concat(validate30.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.planned !== void 0) {
                      const _errs9 = errors;
                      if (
                        !validate30(data.planned, {
                          instancePath: instancePath + "/planned",
                          parentData: data,
                          parentDataProperty: "planned",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate30.errors
                            : vErrors.concat(validate30.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.reason !== void 0) {
                        let data7 = data.reason;
                        const _errs10 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate203.errors = [
                            {
                              instancePath: instancePath + "/reason",
                              schemaPath: "#/properties/reason/type",
                              keyword: "type",
                              params: { type: schema38.properties.reason.type },
                              message: "must be string,null",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs10 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.session_id !== void 0) {
                          const _errs12 = errors;
                          if (typeof data.session_id !== "string") {
                            validate203.errors = [
                              {
                                instancePath: instancePath + "/session_id",
                                schemaPath: "#/properties/session_id/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs12 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.skipped !== void 0) {
                            const _errs14 = errors;
                            if (
                              !validate30(data.skipped, {
                                instancePath: instancePath + "/skipped",
                                parentData: data,
                                parentDataProperty: "skipped",
                                rootData,
                              })
                            ) {
                              vErrors =
                                vErrors === null
                                  ? validate30.errors
                                  : vErrors.concat(validate30.errors);
                              errors = vErrors.length;
                            }
                            var valid0 = _errs14 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.state !== void 0) {
                              const _errs15 = errors;
                              if (
                                !validate101(data.state, {
                                  instancePath: instancePath + "/state",
                                  parentData: data,
                                  parentDataProperty: "state",
                                  rootData,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate101.errors
                                    : vErrors.concat(validate101.errors);
                                errors = vErrors.length;
                              }
                              var valid0 = _errs15 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.submitted !== void 0) {
                                const _errs16 = errors;
                                if (
                                  !validate30(data.submitted, {
                                    instancePath: instancePath + "/submitted",
                                    parentData: data,
                                    parentDataProperty: "submitted",
                                    rootData,
                                  })
                                ) {
                                  vErrors =
                                    vErrors === null
                                      ? validate30.errors
                                      : vErrors.concat(validate30.errors);
                                  errors = vErrors.length;
                                }
                                var valid0 = _errs16 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (
                                  data.total_dispatch_lateness_ns !== void 0
                                ) {
                                  const _errs17 = errors;
                                  if (
                                    !validate30(
                                      data.total_dispatch_lateness_ns,
                                      {
                                        instancePath:
                                          instancePath +
                                          "/total_dispatch_lateness_ns",
                                        parentData: data,
                                        parentDataProperty:
                                          "total_dispatch_lateness_ns",
                                        rootData,
                                      },
                                    )
                                  ) {
                                    vErrors =
                                      vErrors === null
                                        ? validate30.errors
                                        : vErrors.concat(validate30.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid0 = _errs17 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.unknown !== void 0) {
                                    const _errs18 = errors;
                                    if (
                                      !validate30(data.unknown, {
                                        instancePath: instancePath + "/unknown",
                                        parentData: data,
                                        parentDataProperty: "unknown",
                                        rootData,
                                      })
                                    ) {
                                      vErrors =
                                        vErrors === null
                                          ? validate30.errors
                                          : vErrors.concat(validate30.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid0 = _errs18 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate203.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate203.errors = vErrors;
  return errors === 0;
}
var periodic_tasks = validate214;
function validate94(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === void 0 && (missing0 = "id")) ||
        (data.session_id === void 0 && (missing0 = "session_id")) ||
        (data.client_request_id === void 0 &&
          (missing0 = "client_request_id")) ||
        (data.generation === void 0 && (missing0 = "generation")) ||
        (data.state === void 0 && (missing0 = "state")) ||
        (data.planned === void 0 && (missing0 = "planned")) ||
        (data.attempted === void 0 && (missing0 = "attempted")) ||
        (data.submitted === void 0 && (missing0 = "submitted")) ||
        (data.failed === void 0 && (missing0 = "failed")) ||
        (data.unknown === void 0 && (missing0 = "unknown")) ||
        (data.skipped === void 0 && (missing0 = "skipped")) ||
        (data.max_dispatch_lateness_ns === void 0 &&
          (missing0 = "max_dispatch_lateness_ns")) ||
        (data.total_dispatch_lateness_ns === void 0 &&
          (missing0 = "total_dispatch_lateness_ns"))
      ) {
        validate94.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.attempted !== void 0) {
          const _errs1 = errors;
          if (
            !validate30(data.attempted, {
              instancePath: instancePath + "/attempted",
              parentData: data,
              parentDataProperty: "attempted",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate30.errors
                : vErrors.concat(validate30.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.client_request_id !== void 0) {
            const _errs2 = errors;
            if (typeof data.client_request_id !== "string") {
              validate94.errors = [
                {
                  instancePath: instancePath + "/client_request_id",
                  schemaPath: "#/properties/client_request_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.failed !== void 0) {
              const _errs4 = errors;
              if (
                !validate30(data.failed, {
                  instancePath: instancePath + "/failed",
                  parentData: data,
                  parentDataProperty: "failed",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.generation !== void 0) {
                const _errs5 = errors;
                if (
                  !validate30(data.generation, {
                    instancePath: instancePath + "/generation",
                    parentData: data,
                    parentDataProperty: "generation",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate30.errors
                      : vErrors.concat(validate30.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.id !== void 0) {
                  const _errs6 = errors;
                  if (typeof data.id !== "string") {
                    validate94.errors = [
                      {
                        instancePath: instancePath + "/id",
                        schemaPath: "#/properties/id/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.max_dispatch_lateness_ns !== void 0) {
                    const _errs8 = errors;
                    if (
                      !validate30(data.max_dispatch_lateness_ns, {
                        instancePath:
                          instancePath + "/max_dispatch_lateness_ns",
                        parentData: data,
                        parentDataProperty: "max_dispatch_lateness_ns",
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate30.errors
                          : vErrors.concat(validate30.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.planned !== void 0) {
                      const _errs9 = errors;
                      if (
                        !validate30(data.planned, {
                          instancePath: instancePath + "/planned",
                          parentData: data,
                          parentDataProperty: "planned",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate30.errors
                            : vErrors.concat(validate30.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.reason !== void 0) {
                        let data7 = data.reason;
                        const _errs10 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate94.errors = [
                            {
                              instancePath: instancePath + "/reason",
                              schemaPath: "#/properties/reason/type",
                              keyword: "type",
                              params: { type: schema38.properties.reason.type },
                              message: "must be string,null",
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs10 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.session_id !== void 0) {
                          const _errs12 = errors;
                          if (typeof data.session_id !== "string") {
                            validate94.errors = [
                              {
                                instancePath: instancePath + "/session_id",
                                schemaPath: "#/properties/session_id/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs12 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.skipped !== void 0) {
                            const _errs14 = errors;
                            if (
                              !validate30(data.skipped, {
                                instancePath: instancePath + "/skipped",
                                parentData: data,
                                parentDataProperty: "skipped",
                                rootData,
                              })
                            ) {
                              vErrors =
                                vErrors === null
                                  ? validate30.errors
                                  : vErrors.concat(validate30.errors);
                              errors = vErrors.length;
                            }
                            var valid0 = _errs14 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.state !== void 0) {
                              const _errs15 = errors;
                              if (
                                !validate101(data.state, {
                                  instancePath: instancePath + "/state",
                                  parentData: data,
                                  parentDataProperty: "state",
                                  rootData,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate101.errors
                                    : vErrors.concat(validate101.errors);
                                errors = vErrors.length;
                              }
                              var valid0 = _errs15 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.submitted !== void 0) {
                                const _errs16 = errors;
                                if (
                                  !validate30(data.submitted, {
                                    instancePath: instancePath + "/submitted",
                                    parentData: data,
                                    parentDataProperty: "submitted",
                                    rootData,
                                  })
                                ) {
                                  vErrors =
                                    vErrors === null
                                      ? validate30.errors
                                      : vErrors.concat(validate30.errors);
                                  errors = vErrors.length;
                                }
                                var valid0 = _errs16 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (
                                  data.total_dispatch_lateness_ns !== void 0
                                ) {
                                  const _errs17 = errors;
                                  if (
                                    !validate30(
                                      data.total_dispatch_lateness_ns,
                                      {
                                        instancePath:
                                          instancePath +
                                          "/total_dispatch_lateness_ns",
                                        parentData: data,
                                        parentDataProperty:
                                          "total_dispatch_lateness_ns",
                                        rootData,
                                      },
                                    )
                                  ) {
                                    vErrors =
                                      vErrors === null
                                        ? validate30.errors
                                        : vErrors.concat(validate30.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid0 = _errs17 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.unknown !== void 0) {
                                    const _errs18 = errors;
                                    if (
                                      !validate30(data.unknown, {
                                        instancePath: instancePath + "/unknown",
                                        parentData: data,
                                        parentDataProperty: "unknown",
                                        rootData,
                                      })
                                    ) {
                                      vErrors =
                                        vErrors === null
                                          ? validate30.errors
                                          : vErrors.concat(validate30.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid0 = _errs18 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate94.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate94.errors = vErrors;
  return errors === 0;
}
function validate214(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.tasks === void 0 && (missing0 = "tasks")) {
        validate214.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.tasks !== void 0) {
          let data0 = data.tasks;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate94(data0[i0], {
                    instancePath: instancePath + "/tasks/" + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate94.errors
                      : vErrors.concat(validate94.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate214.errors = [
                {
                  instancePath: instancePath + "/tasks",
                  schemaPath: "#/properties/tasks/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate214.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate214.errors = vErrors;
  return errors === 0;
}
var receipt_lookup = validate216;
function validate216(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        data.client_request_id === void 0 &&
        (missing0 = "client_request_id")
      ) {
        validate216.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "client_request_id" || key0 === "generation")) {
            validate216.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.client_request_id !== void 0) {
            let data0 = data.client_request_id;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func2(data0) > 128) {
                  validate216.errors = [
                    {
                      instancePath: instancePath + "/client_request_id",
                      schemaPath: "#/properties/client_request_id/maxLength",
                      keyword: "maxLength",
                      params: { limit: 128 },
                      message: "must NOT have more than 128 characters",
                    },
                  ];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate216.errors = [
                      {
                        instancePath: instancePath + "/client_request_id",
                        schemaPath: "#/properties/client_request_id/minLength",
                        keyword: "minLength",
                        params: { limit: 1 },
                        message: "must NOT have fewer than 1 characters",
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate216.errors = [
                  {
                    instancePath: instancePath + "/client_request_id",
                    schemaPath: "#/properties/client_request_id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.generation !== void 0) {
              let data1 = data.generation;
              const _errs4 = errors;
              const _errs5 = errors;
              let valid1 = false;
              const _errs6 = errors;
              if (
                !validate30(data1, {
                  instancePath: instancePath + "/generation",
                  parentData: data,
                  parentDataProperty: "generation",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs6 === errors;
              valid1 = valid1 || _valid0;
              if (!valid1) {
                const _errs7 = errors;
                if (data1 !== null) {
                  const err0 = {
                    instancePath: instancePath + "/generation",
                    schemaPath: "#/properties/generation/anyOf/1/type",
                    keyword: "type",
                    params: { type: "null" },
                    message: "must be null",
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs7 === errors;
                valid1 = valid1 || _valid0;
              }
              if (!valid1) {
                const err1 = {
                  instancePath: instancePath + "/generation",
                  schemaPath: "#/properties/generation/anyOf",
                  keyword: "anyOf",
                  params: {},
                  message: "must match a schema in anyOf",
                };
                if (vErrors === null) {
                  vErrors = [err1];
                } else {
                  vErrors.push(err1);
                }
                errors++;
                validate216.errors = vErrors;
                return false;
              } else {
                errors = _errs5;
                if (vErrors !== null) {
                  if (_errs5) {
                    vErrors.length = _errs5;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate216.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate216.errors = vErrors;
  return errors === 0;
}
var session = validate218;
var schema42 = {
  type: "object",
  properties: {
    channel_id: { type: "string" },
    config: { $ref: "#/definitions/EffectiveConfig" },
    controller: { type: ["string", "null"] },
    fault: { anyOf: [{ $ref: "#/definitions/FaultCode" }, { type: "null" }] },
    generation: { $ref: "#/definitions/Decimal" },
    id: { type: "string" },
    mode: { $ref: "#/definitions/SessionMode" },
    revision: { $ref: "#/definitions/Decimal" },
    state: { $ref: "#/definitions/SessionState" },
  },
  required: [
    "channel_id",
    "config",
    "controller",
    "fault",
    "generation",
    "id",
    "mode",
    "revision",
    "state",
  ],
};
function validate218(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.config === void 0 && (missing0 = "config")) ||
        (data.controller === void 0 && (missing0 = "controller")) ||
        (data.fault === void 0 && (missing0 = "fault")) ||
        (data.generation === void 0 && (missing0 = "generation")) ||
        (data.id === void 0 && (missing0 = "id")) ||
        (data.mode === void 0 && (missing0 = "mode")) ||
        (data.revision === void 0 && (missing0 = "revision")) ||
        (data.state === void 0 && (missing0 = "state"))
      ) {
        validate218.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.channel_id !== void 0) {
          const _errs1 = errors;
          if (typeof data.channel_id !== "string") {
            validate218.errors = [
              {
                instancePath: instancePath + "/channel_id",
                schemaPath: "#/properties/channel_id/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.config !== void 0) {
            const _errs3 = errors;
            if (
              !validate56(data.config, {
                instancePath: instancePath + "/config",
                parentData: data,
                parentDataProperty: "config",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate56.errors
                  : vErrors.concat(validate56.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.controller !== void 0) {
              let data2 = data.controller;
              const _errs4 = errors;
              if (typeof data2 !== "string" && data2 !== null) {
                validate218.errors = [
                  {
                    instancePath: instancePath + "/controller",
                    schemaPath: "#/properties/controller/type",
                    keyword: "type",
                    params: { type: schema42.properties.controller.type },
                    message: "must be string,null",
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fault !== void 0) {
                let data3 = data.fault;
                const _errs6 = errors;
                const _errs7 = errors;
                let valid1 = false;
                const _errs8 = errors;
                if (
                  !validate59(data3, {
                    instancePath: instancePath + "/fault",
                    parentData: data,
                    parentDataProperty: "fault",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate59.errors
                      : vErrors.concat(validate59.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs8 === errors;
                valid1 = valid1 || _valid0;
                if (!valid1) {
                  const _errs9 = errors;
                  if (data3 !== null) {
                    const err0 = {
                      instancePath: instancePath + "/fault",
                      schemaPath: "#/properties/fault/anyOf/1/type",
                      keyword: "type",
                      params: { type: "null" },
                      message: "must be null",
                    };
                    if (vErrors === null) {
                      vErrors = [err0];
                    } else {
                      vErrors.push(err0);
                    }
                    errors++;
                  }
                  var _valid0 = _errs9 === errors;
                  valid1 = valid1 || _valid0;
                }
                if (!valid1) {
                  const err1 = {
                    instancePath: instancePath + "/fault",
                    schemaPath: "#/properties/fault/anyOf",
                    keyword: "anyOf",
                    params: {},
                    message: "must match a schema in anyOf",
                  };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate218.errors = vErrors;
                  return false;
                } else {
                  errors = _errs7;
                  if (vErrors !== null) {
                    if (_errs7) {
                      vErrors.length = _errs7;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.generation !== void 0) {
                  const _errs11 = errors;
                  if (
                    !validate30(data.generation, {
                      instancePath: instancePath + "/generation",
                      parentData: data,
                      parentDataProperty: "generation",
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate30.errors
                        : vErrors.concat(validate30.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.id !== void 0) {
                    const _errs12 = errors;
                    if (typeof data.id !== "string") {
                      validate218.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.mode !== void 0) {
                      const _errs14 = errors;
                      if (
                        !validate45(data.mode, {
                          instancePath: instancePath + "/mode",
                          parentData: data,
                          parentDataProperty: "mode",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate45.errors
                            : vErrors.concat(validate45.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs14 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.revision !== void 0) {
                        const _errs15 = errors;
                        if (
                          !validate30(data.revision, {
                            instancePath: instancePath + "/revision",
                            parentData: data,
                            parentDataProperty: "revision",
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate30.errors
                              : vErrors.concat(validate30.errors);
                          errors = vErrors.length;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.state !== void 0) {
                          const _errs16 = errors;
                          if (
                            !validate61(data.state, {
                              instancePath: instancePath + "/state",
                              parentData: data,
                              parentDataProperty: "state",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate61.errors
                                : vErrors.concat(validate61.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate218.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate218.errors = vErrors;
  return errors === 0;
}
var sessions = validate225;
function validate113(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.channel_id === void 0 && (missing0 = "channel_id")) ||
        (data.config === void 0 && (missing0 = "config")) ||
        (data.controller === void 0 && (missing0 = "controller")) ||
        (data.fault === void 0 && (missing0 = "fault")) ||
        (data.generation === void 0 && (missing0 = "generation")) ||
        (data.id === void 0 && (missing0 = "id")) ||
        (data.mode === void 0 && (missing0 = "mode")) ||
        (data.revision === void 0 && (missing0 = "revision")) ||
        (data.state === void 0 && (missing0 = "state"))
      ) {
        validate113.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.channel_id !== void 0) {
          const _errs1 = errors;
          if (typeof data.channel_id !== "string") {
            validate113.errors = [
              {
                instancePath: instancePath + "/channel_id",
                schemaPath: "#/properties/channel_id/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.config !== void 0) {
            const _errs3 = errors;
            if (
              !validate56(data.config, {
                instancePath: instancePath + "/config",
                parentData: data,
                parentDataProperty: "config",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate56.errors
                  : vErrors.concat(validate56.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.controller !== void 0) {
              let data2 = data.controller;
              const _errs4 = errors;
              if (typeof data2 !== "string" && data2 !== null) {
                validate113.errors = [
                  {
                    instancePath: instancePath + "/controller",
                    schemaPath: "#/properties/controller/type",
                    keyword: "type",
                    params: { type: schema42.properties.controller.type },
                    message: "must be string,null",
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fault !== void 0) {
                let data3 = data.fault;
                const _errs6 = errors;
                const _errs7 = errors;
                let valid1 = false;
                const _errs8 = errors;
                if (
                  !validate59(data3, {
                    instancePath: instancePath + "/fault",
                    parentData: data,
                    parentDataProperty: "fault",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate59.errors
                      : vErrors.concat(validate59.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs8 === errors;
                valid1 = valid1 || _valid0;
                if (!valid1) {
                  const _errs9 = errors;
                  if (data3 !== null) {
                    const err0 = {
                      instancePath: instancePath + "/fault",
                      schemaPath: "#/properties/fault/anyOf/1/type",
                      keyword: "type",
                      params: { type: "null" },
                      message: "must be null",
                    };
                    if (vErrors === null) {
                      vErrors = [err0];
                    } else {
                      vErrors.push(err0);
                    }
                    errors++;
                  }
                  var _valid0 = _errs9 === errors;
                  valid1 = valid1 || _valid0;
                }
                if (!valid1) {
                  const err1 = {
                    instancePath: instancePath + "/fault",
                    schemaPath: "#/properties/fault/anyOf",
                    keyword: "anyOf",
                    params: {},
                    message: "must match a schema in anyOf",
                  };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate113.errors = vErrors;
                  return false;
                } else {
                  errors = _errs7;
                  if (vErrors !== null) {
                    if (_errs7) {
                      vErrors.length = _errs7;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.generation !== void 0) {
                  const _errs11 = errors;
                  if (
                    !validate30(data.generation, {
                      instancePath: instancePath + "/generation",
                      parentData: data,
                      parentDataProperty: "generation",
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate30.errors
                        : vErrors.concat(validate30.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.id !== void 0) {
                    const _errs12 = errors;
                    if (typeof data.id !== "string") {
                      validate113.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "string" },
                          message: "must be string",
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.mode !== void 0) {
                      const _errs14 = errors;
                      if (
                        !validate45(data.mode, {
                          instancePath: instancePath + "/mode",
                          parentData: data,
                          parentDataProperty: "mode",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate45.errors
                            : vErrors.concat(validate45.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs14 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.revision !== void 0) {
                        const _errs15 = errors;
                        if (
                          !validate30(data.revision, {
                            instancePath: instancePath + "/revision",
                            parentData: data,
                            parentDataProperty: "revision",
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate30.errors
                              : vErrors.concat(validate30.errors);
                          errors = vErrors.length;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.state !== void 0) {
                          const _errs16 = errors;
                          if (
                            !validate61(data.state, {
                              instancePath: instancePath + "/state",
                              parentData: data,
                              parentDataProperty: "state",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate61.errors
                                : vErrors.concat(validate61.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate113.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate113.errors = vErrors;
  return errors === 0;
}
function validate225(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.sessions === void 0 && (missing0 = "sessions")) {
        validate225.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.sessions !== void 0) {
          let data0 = data.sessions;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate113(data0[i0], {
                    instancePath: instancePath + "/sessions/" + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate113.errors
                      : vErrors.concat(validate113.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate225.errors = [
                {
                  instancePath: instancePath + "/sessions",
                  schemaPath: "#/properties/sessions/type",
                  keyword: "type",
                  params: { type: "array" },
                  message: "must be array",
                },
              ];
              return false;
            }
          }
        }
      }
    } else {
      validate225.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate225.errors = vErrors;
  return errors === 0;
}
var stream_message = validate227;
var schema45 = {
  oneOf: [
    {
      type: "object",
      properties: {
        device_raw_timestamp_us: {
          type: ["integer", "null"],
          format: "uint32",
          minimum: 0,
        },
        device_timestamp_us: {
          anyOf: [{ $ref: "#/definitions/Decimal" }, { type: "null" }],
        },
        direction: { $ref: "#/definitions/Direction" },
        frame: { $ref: "#/definitions/Frame" },
        host_monotonic_ns: { $ref: "#/definitions/Decimal" },
        raw_dlc: {
          type: ["integer", "null"],
          format: "uint8",
          maximum: 255,
          minimum: 0,
        },
        sequence: { $ref: "#/definitions/Decimal" },
        timestamp_epoch: { $ref: "#/definitions/Decimal" },
        timestamp_quality: { $ref: "#/definitions/TimestampQuality" },
        type: { type: "string", const: "frame_received" },
      },
      required: [
        "type",
        "sequence",
        "host_monotonic_ns",
        "timestamp_quality",
        "timestamp_epoch",
        "direction",
        "frame",
      ],
    },
    {
      type: "object",
      properties: {
        device_raw_timestamp_us: {
          type: ["integer", "null"],
          format: "uint32",
          minimum: 0,
        },
        device_timestamp_us: {
          anyOf: [{ $ref: "#/definitions/Decimal" }, { type: "null" }],
        },
        error_classes: { type: "integer", format: "uint32", minimum: 0 },
        host_monotonic_ns: { $ref: "#/definitions/Decimal" },
        overflow: { type: "boolean" },
        raw_data_hex: { type: "string" },
        sequence: { $ref: "#/definitions/Decimal" },
        timestamp_epoch: { $ref: "#/definitions/Decimal" },
        timestamp_quality: { $ref: "#/definitions/TimestampQuality" },
        type: { type: "string", const: "bus_diagnostic" },
      },
      required: [
        "type",
        "sequence",
        "host_monotonic_ns",
        "timestamp_quality",
        "timestamp_epoch",
        "error_classes",
        "raw_data_hex",
        "overflow",
      ],
    },
  ],
};
var schema46 = { type: "string", enum: ["rx", "tx"] };
function validate127(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate127.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(data === "rx" || data === "tx")) {
    validate127.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema46.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate127.errors = vErrors;
  return errors === 0;
}
var schema47 = {
  type: "object",
  properties: {
    brs: { type: "boolean" },
    data_hex: {
      type: "string",
      maxLength: 128,
      pattern: "^([0-9A-Fa-f]{2})*$",
    },
    dlc: { type: "integer", format: "uint8", maximum: 255, minimum: 0 },
    esi: { type: "boolean" },
    extended: { type: "boolean" },
    id: { type: "integer", format: "uint32", maximum: 536870911, minimum: 0 },
    kind: { $ref: "#/definitions/FrameKind" },
  },
  allOf: [
    {
      else: { properties: { id: { maximum: 2047 } } },
      if: { properties: { extended: { const: true } }, required: ["extended"] },
    },
    {
      if: {
        properties: { kind: { enum: ["classic_data", "classic_remote"] } },
      },
      then: {
        properties: {
          brs: { const: false },
          data_hex: { maxLength: 16 },
          dlc: { type: ["integer", "null"], maximum: 8 },
        },
      },
    },
    {
      if: { properties: { kind: { const: "classic_remote" } } },
      then: {
        properties: {
          data_hex: { const: "" },
          dlc: { type: "integer", maximum: 8, minimum: 0 },
        },
        required: ["dlc"],
      },
    },
    {
      if: { properties: { kind: { const: "fd_data" } } },
      then: {
        properties: {
          data_hex: {
            pattern:
              "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
          },
        },
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 0 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: { properties: { data_hex: { maxLength: 0, minLength: 0 } } },
    },
    {
      if: {
        properties: {
          dlc: { const: 1 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 2, minLength: 2 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 2 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 4, minLength: 4 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 3 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 6, minLength: 6 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 4 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 8, minLength: 8 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 5 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 10, minLength: 10 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 6 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 12, minLength: 12 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 7 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 14, minLength: 14 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 8 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 16, minLength: 16 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 9 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 24, minLength: 24 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 10 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 32, minLength: 32 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 11 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 40, minLength: 40 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 12 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 48, minLength: 48 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 13 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 64, minLength: 64 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 14 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 96, minLength: 96 } },
        required: ["data_hex"],
      },
    },
    {
      if: {
        properties: {
          dlc: { const: 15 },
          kind: { enum: ["classic_data", "fd_data"] },
        },
        required: ["dlc"],
      },
      then: {
        properties: { data_hex: { maxLength: 128, minLength: 128 } },
        required: ["data_hex"],
      },
    },
  ],
  required: ["kind", "id", "extended", "brs", "esi", "data_hex", "dlc"],
};
function validate129(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs1 = errors;
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (data.extended === void 0 && (missing0 = "extended")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.extended !== void 0) {
        if (true !== data.extended) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  if (!_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id !== void 0) {
        let data1 = data.id;
        if (typeof data1 == "number") {
          if (data1 > 2047 || isNaN(data1)) {
            validate129.errors = [
              {
                instancePath: instancePath + "/id",
                schemaPath: "#/allOf/0/else/properties/id/maximum",
                keyword: "maximum",
                params: { comparison: "<=", limit: 2047 },
                message: "must be <= 2047",
              },
            ];
            return false;
          }
        }
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err2 = {
      instancePath,
      schemaPath: "#/allOf/0/if",
      keyword: "if",
      params: { failingKeyword: "else" },
      message: 'must match "else" schema',
    };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
    validate129.errors = vErrors;
    return false;
  }
  var valid0 = _errs1 === errors;
  if (valid0) {
    const _errs7 = errors;
    const _errs8 = errors;
    let valid4 = true;
    const _errs9 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.kind !== void 0) {
        let data2 = data.kind;
        if (!(data2 === "classic_data" || data2 === "classic_remote")) {
          const err3 = {};
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
    }
    var _valid1 = _errs9 === errors;
    errors = _errs8;
    if (vErrors !== null) {
      if (_errs8) {
        vErrors.length = _errs8;
      } else {
        vErrors = null;
      }
    }
    if (_valid1) {
      const _errs11 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.brs !== void 0) {
          const _errs12 = errors;
          if (false !== data.brs) {
            validate129.errors = [
              {
                instancePath: instancePath + "/brs",
                schemaPath: "#/allOf/1/then/properties/brs/const",
                keyword: "const",
                params: { allowedValue: false },
                message: "must be equal to constant",
              },
            ];
            return false;
          }
          var valid6 = _errs12 === errors;
        } else {
          var valid6 = true;
        }
        if (valid6) {
          if (data.data_hex !== void 0) {
            let data4 = data.data_hex;
            const _errs13 = errors;
            if (typeof data4 === "string") {
              if (func2(data4) > 16) {
                validate129.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/1/then/properties/data_hex/maxLength",
                    keyword: "maxLength",
                    params: { limit: 16 },
                    message: "must NOT have more than 16 characters",
                  },
                ];
                return false;
              }
            }
            var valid6 = _errs13 === errors;
          } else {
            var valid6 = true;
          }
          if (valid6) {
            if (data.dlc !== void 0) {
              let data5 = data.dlc;
              const _errs14 = errors;
              if (
                !(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5)) &&
                data5 !== null
              ) {
                validate129.errors = [
                  {
                    instancePath: instancePath + "/dlc",
                    schemaPath: "#/allOf/1/then/properties/dlc/type",
                    keyword: "type",
                    params: {
                      type: schema47.allOf[1].then.properties.dlc.type,
                    },
                    message: "must be integer,null",
                  },
                ];
                return false;
              }
              if (errors === _errs14) {
                if (typeof data5 == "number") {
                  if (data5 > 8 || isNaN(data5)) {
                    validate129.errors = [
                      {
                        instancePath: instancePath + "/dlc",
                        schemaPath: "#/allOf/1/then/properties/dlc/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 8 },
                        message: "must be <= 8",
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid6 = _errs14 === errors;
            } else {
              var valid6 = true;
            }
          }
        }
      }
      var _valid1 = _errs11 === errors;
      valid4 = _valid1;
    }
    if (!valid4) {
      const err4 = {
        instancePath,
        schemaPath: "#/allOf/1/if",
        keyword: "if",
        params: { failingKeyword: "then" },
        message: 'must match "then" schema',
      };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
      validate129.errors = vErrors;
      return false;
    }
    var valid0 = _errs7 === errors;
    if (valid0) {
      const _errs16 = errors;
      const _errs17 = errors;
      let valid7 = true;
      const _errs18 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.kind !== void 0) {
          if ("classic_remote" !== data.kind) {
            const err5 = {};
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
      }
      var _valid2 = _errs18 === errors;
      errors = _errs17;
      if (vErrors !== null) {
        if (_errs17) {
          vErrors.length = _errs17;
        } else {
          vErrors = null;
        }
      }
      if (_valid2) {
        const _errs20 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing1;
          if (data.dlc === void 0 && (missing1 = "dlc")) {
            validate129.errors = [
              {
                instancePath,
                schemaPath: "#/allOf/2/then/required",
                keyword: "required",
                params: { missingProperty: missing1 },
                message: "must have required property '" + missing1 + "'",
              },
            ];
            return false;
          } else {
            if (data.data_hex !== void 0) {
              const _errs21 = errors;
              if ("" !== data.data_hex) {
                validate129.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/allOf/2/then/properties/data_hex/const",
                    keyword: "const",
                    params: { allowedValue: "" },
                    message: "must be equal to constant",
                  },
                ];
                return false;
              }
              var valid9 = _errs21 === errors;
            } else {
              var valid9 = true;
            }
            if (valid9) {
              if (data.dlc !== void 0) {
                let data8 = data.dlc;
                const _errs22 = errors;
                if (!(
                  typeof data8 == "number" &&
                  !(data8 % 1) &&
                  !isNaN(data8)
                )) {
                  validate129.errors = [
                    {
                      instancePath: instancePath + "/dlc",
                      schemaPath: "#/allOf/2/then/properties/dlc/type",
                      keyword: "type",
                      params: { type: "integer" },
                      message: "must be integer",
                    },
                  ];
                  return false;
                }
                if (errors === _errs22) {
                  if (typeof data8 == "number") {
                    if (data8 > 8 || isNaN(data8)) {
                      validate129.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/allOf/2/then/properties/dlc/maximum",
                          keyword: "maximum",
                          params: { comparison: "<=", limit: 8 },
                          message: "must be <= 8",
                        },
                      ];
                      return false;
                    } else {
                      if (data8 < 0 || isNaN(data8)) {
                        validate129.errors = [
                          {
                            instancePath: instancePath + "/dlc",
                            schemaPath: "#/allOf/2/then/properties/dlc/minimum",
                            keyword: "minimum",
                            params: { comparison: ">=", limit: 0 },
                            message: "must be >= 0",
                          },
                        ];
                        return false;
                      }
                    }
                  }
                }
                var valid9 = _errs22 === errors;
              } else {
                var valid9 = true;
              }
            }
          }
        }
        var _valid2 = _errs20 === errors;
        valid7 = _valid2;
      }
      if (!valid7) {
        const err6 = {
          instancePath,
          schemaPath: "#/allOf/2/if",
          keyword: "if",
          params: { failingKeyword: "then" },
          message: 'must match "then" schema',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
        validate129.errors = vErrors;
        return false;
      }
      var valid0 = _errs16 === errors;
      if (valid0) {
        const _errs24 = errors;
        const _errs25 = errors;
        let valid10 = true;
        const _errs26 = errors;
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind !== void 0) {
            if ("fd_data" !== data.kind) {
              const err7 = {};
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
        }
        var _valid3 = _errs26 === errors;
        errors = _errs25;
        if (vErrors !== null) {
          if (_errs25) {
            vErrors.length = _errs25;
          } else {
            vErrors = null;
          }
        }
        if (_valid3) {
          const _errs28 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            if (data.data_hex !== void 0) {
              let data10 = data.data_hex;
              if (typeof data10 === "string") {
                if (!pattern1.test(data10)) {
                  validate129.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/allOf/3/then/properties/data_hex/pattern",
                      keyword: "pattern",
                      params: {
                        pattern:
                          "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$",
                      },
                      message:
                        'must match pattern "^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$"',
                    },
                  ];
                  return false;
                }
              }
            }
          }
          var _valid3 = _errs28 === errors;
          valid10 = _valid3;
        }
        if (!valid10) {
          const err8 = {
            instancePath,
            schemaPath: "#/allOf/3/if",
            keyword: "if",
            params: { failingKeyword: "then" },
            message: 'must match "then" schema',
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
          validate129.errors = vErrors;
          return false;
        }
        var valid0 = _errs24 === errors;
        if (valid0) {
          const _errs30 = errors;
          const _errs31 = errors;
          let valid13 = true;
          const _errs32 = errors;
          if (data && typeof data == "object" && !Array.isArray(data)) {
            let missing2;
            if (data.dlc === void 0 && (missing2 = "dlc")) {
              const err9 = {};
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            } else {
              if (data.dlc !== void 0) {
                const _errs33 = errors;
                if (0 !== data.dlc) {
                  const err10 = {};
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                var valid14 = _errs33 === errors;
              } else {
                var valid14 = true;
              }
              if (valid14) {
                if (data.kind !== void 0) {
                  let data12 = data.kind;
                  const _errs34 = errors;
                  if (!(data12 === "classic_data" || data12 === "fd_data")) {
                    const err11 = {};
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                  var valid14 = _errs34 === errors;
                } else {
                  var valid14 = true;
                }
              }
            }
          }
          var _valid4 = _errs32 === errors;
          errors = _errs31;
          if (vErrors !== null) {
            if (_errs31) {
              vErrors.length = _errs31;
            } else {
              vErrors = null;
            }
          }
          if (_valid4) {
            const _errs35 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              if (data.data_hex !== void 0) {
                let data13 = data.data_hex;
                if (typeof data13 === "string") {
                  if (func2(data13) > 0) {
                    validate129.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath:
                          "#/allOf/4/then/properties/data_hex/maxLength",
                        keyword: "maxLength",
                        params: { limit: 0 },
                        message: "must NOT have more than 0 characters",
                      },
                    ];
                    return false;
                  } else {
                    if (func2(data13) < 0) {
                      validate129.errors = [
                        {
                          instancePath: instancePath + "/data_hex",
                          schemaPath:
                            "#/allOf/4/then/properties/data_hex/minLength",
                          keyword: "minLength",
                          params: { limit: 0 },
                          message: "must NOT have fewer than 0 characters",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
            }
            var _valid4 = _errs35 === errors;
            valid13 = _valid4;
          }
          if (!valid13) {
            const err12 = {
              instancePath,
              schemaPath: "#/allOf/4/if",
              keyword: "if",
              params: { failingKeyword: "then" },
              message: 'must match "then" schema',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
            validate129.errors = vErrors;
            return false;
          }
          var valid0 = _errs30 === errors;
          if (valid0) {
            const _errs37 = errors;
            const _errs38 = errors;
            let valid16 = true;
            const _errs39 = errors;
            if (data && typeof data == "object" && !Array.isArray(data)) {
              let missing3;
              if (data.dlc === void 0 && (missing3 = "dlc")) {
                const err13 = {};
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              } else {
                if (data.dlc !== void 0) {
                  const _errs40 = errors;
                  if (1 !== data.dlc) {
                    const err14 = {};
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                  var valid17 = _errs40 === errors;
                } else {
                  var valid17 = true;
                }
                if (valid17) {
                  if (data.kind !== void 0) {
                    let data15 = data.kind;
                    const _errs41 = errors;
                    if (!(data15 === "classic_data" || data15 === "fd_data")) {
                      const err15 = {};
                      if (vErrors === null) {
                        vErrors = [err15];
                      } else {
                        vErrors.push(err15);
                      }
                      errors++;
                    }
                    var valid17 = _errs41 === errors;
                  } else {
                    var valid17 = true;
                  }
                }
              }
            }
            var _valid5 = _errs39 === errors;
            errors = _errs38;
            if (vErrors !== null) {
              if (_errs38) {
                vErrors.length = _errs38;
              } else {
                vErrors = null;
              }
            }
            if (_valid5) {
              const _errs42 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing4;
                if (data.data_hex === void 0 && (missing4 = "data_hex")) {
                  validate129.errors = [
                    {
                      instancePath,
                      schemaPath: "#/allOf/5/then/required",
                      keyword: "required",
                      params: { missingProperty: missing4 },
                      message: "must have required property '" + missing4 + "'",
                    },
                  ];
                  return false;
                } else {
                  if (data.data_hex !== void 0) {
                    let data16 = data.data_hex;
                    if (typeof data16 === "string") {
                      if (func2(data16) > 2) {
                        validate129.errors = [
                          {
                            instancePath: instancePath + "/data_hex",
                            schemaPath:
                              "#/allOf/5/then/properties/data_hex/maxLength",
                            keyword: "maxLength",
                            params: { limit: 2 },
                            message: "must NOT have more than 2 characters",
                          },
                        ];
                        return false;
                      } else {
                        if (func2(data16) < 2) {
                          validate129.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/5/then/properties/data_hex/minLength",
                              keyword: "minLength",
                              params: { limit: 2 },
                              message: "must NOT have fewer than 2 characters",
                            },
                          ];
                          return false;
                        }
                      }
                    }
                  }
                }
              }
              var _valid5 = _errs42 === errors;
              valid16 = _valid5;
            }
            if (!valid16) {
              const err16 = {
                instancePath,
                schemaPath: "#/allOf/5/if",
                keyword: "if",
                params: { failingKeyword: "then" },
                message: 'must match "then" schema',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
              validate129.errors = vErrors;
              return false;
            }
            var valid0 = _errs37 === errors;
            if (valid0) {
              const _errs44 = errors;
              const _errs45 = errors;
              let valid19 = true;
              const _errs46 = errors;
              if (data && typeof data == "object" && !Array.isArray(data)) {
                let missing5;
                if (data.dlc === void 0 && (missing5 = "dlc")) {
                  const err17 = {};
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                } else {
                  if (data.dlc !== void 0) {
                    const _errs47 = errors;
                    if (2 !== data.dlc) {
                      const err18 = {};
                      if (vErrors === null) {
                        vErrors = [err18];
                      } else {
                        vErrors.push(err18);
                      }
                      errors++;
                    }
                    var valid20 = _errs47 === errors;
                  } else {
                    var valid20 = true;
                  }
                  if (valid20) {
                    if (data.kind !== void 0) {
                      let data18 = data.kind;
                      const _errs48 = errors;
                      if (!(
                        data18 === "classic_data" || data18 === "fd_data"
                      )) {
                        const err19 = {};
                        if (vErrors === null) {
                          vErrors = [err19];
                        } else {
                          vErrors.push(err19);
                        }
                        errors++;
                      }
                      var valid20 = _errs48 === errors;
                    } else {
                      var valid20 = true;
                    }
                  }
                }
              }
              var _valid6 = _errs46 === errors;
              errors = _errs45;
              if (vErrors !== null) {
                if (_errs45) {
                  vErrors.length = _errs45;
                } else {
                  vErrors = null;
                }
              }
              if (_valid6) {
                const _errs49 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing6;
                  if (data.data_hex === void 0 && (missing6 = "data_hex")) {
                    validate129.errors = [
                      {
                        instancePath,
                        schemaPath: "#/allOf/6/then/required",
                        keyword: "required",
                        params: { missingProperty: missing6 },
                        message:
                          "must have required property '" + missing6 + "'",
                      },
                    ];
                    return false;
                  } else {
                    if (data.data_hex !== void 0) {
                      let data19 = data.data_hex;
                      if (typeof data19 === "string") {
                        if (func2(data19) > 4) {
                          validate129.errors = [
                            {
                              instancePath: instancePath + "/data_hex",
                              schemaPath:
                                "#/allOf/6/then/properties/data_hex/maxLength",
                              keyword: "maxLength",
                              params: { limit: 4 },
                              message: "must NOT have more than 4 characters",
                            },
                          ];
                          return false;
                        } else {
                          if (func2(data19) < 4) {
                            validate129.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/6/then/properties/data_hex/minLength",
                                keyword: "minLength",
                                params: { limit: 4 },
                                message:
                                  "must NOT have fewer than 4 characters",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                  }
                }
                var _valid6 = _errs49 === errors;
                valid19 = _valid6;
              }
              if (!valid19) {
                const err20 = {
                  instancePath,
                  schemaPath: "#/allOf/6/if",
                  keyword: "if",
                  params: { failingKeyword: "then" },
                  message: 'must match "then" schema',
                };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
                validate129.errors = vErrors;
                return false;
              }
              var valid0 = _errs44 === errors;
              if (valid0) {
                const _errs51 = errors;
                const _errs52 = errors;
                let valid22 = true;
                const _errs53 = errors;
                if (data && typeof data == "object" && !Array.isArray(data)) {
                  let missing7;
                  if (data.dlc === void 0 && (missing7 = "dlc")) {
                    const err21 = {};
                    if (vErrors === null) {
                      vErrors = [err21];
                    } else {
                      vErrors.push(err21);
                    }
                    errors++;
                  } else {
                    if (data.dlc !== void 0) {
                      const _errs54 = errors;
                      if (3 !== data.dlc) {
                        const err22 = {};
                        if (vErrors === null) {
                          vErrors = [err22];
                        } else {
                          vErrors.push(err22);
                        }
                        errors++;
                      }
                      var valid23 = _errs54 === errors;
                    } else {
                      var valid23 = true;
                    }
                    if (valid23) {
                      if (data.kind !== void 0) {
                        let data21 = data.kind;
                        const _errs55 = errors;
                        if (!(
                          data21 === "classic_data" || data21 === "fd_data"
                        )) {
                          const err23 = {};
                          if (vErrors === null) {
                            vErrors = [err23];
                          } else {
                            vErrors.push(err23);
                          }
                          errors++;
                        }
                        var valid23 = _errs55 === errors;
                      } else {
                        var valid23 = true;
                      }
                    }
                  }
                }
                var _valid7 = _errs53 === errors;
                errors = _errs52;
                if (vErrors !== null) {
                  if (_errs52) {
                    vErrors.length = _errs52;
                  } else {
                    vErrors = null;
                  }
                }
                if (_valid7) {
                  const _errs56 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing8;
                    if (data.data_hex === void 0 && (missing8 = "data_hex")) {
                      validate129.errors = [
                        {
                          instancePath,
                          schemaPath: "#/allOf/7/then/required",
                          keyword: "required",
                          params: { missingProperty: missing8 },
                          message:
                            "must have required property '" + missing8 + "'",
                        },
                      ];
                      return false;
                    } else {
                      if (data.data_hex !== void 0) {
                        let data22 = data.data_hex;
                        if (typeof data22 === "string") {
                          if (func2(data22) > 6) {
                            validate129.errors = [
                              {
                                instancePath: instancePath + "/data_hex",
                                schemaPath:
                                  "#/allOf/7/then/properties/data_hex/maxLength",
                                keyword: "maxLength",
                                params: { limit: 6 },
                                message: "must NOT have more than 6 characters",
                              },
                            ];
                            return false;
                          } else {
                            if (func2(data22) < 6) {
                              validate129.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/7/then/properties/data_hex/minLength",
                                  keyword: "minLength",
                                  params: { limit: 6 },
                                  message:
                                    "must NOT have fewer than 6 characters",
                                },
                              ];
                              return false;
                            }
                          }
                        }
                      }
                    }
                  }
                  var _valid7 = _errs56 === errors;
                  valid22 = _valid7;
                }
                if (!valid22) {
                  const err24 = {
                    instancePath,
                    schemaPath: "#/allOf/7/if",
                    keyword: "if",
                    params: { failingKeyword: "then" },
                    message: 'must match "then" schema',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                  validate129.errors = vErrors;
                  return false;
                }
                var valid0 = _errs51 === errors;
                if (valid0) {
                  const _errs58 = errors;
                  const _errs59 = errors;
                  let valid25 = true;
                  const _errs60 = errors;
                  if (data && typeof data == "object" && !Array.isArray(data)) {
                    let missing9;
                    if (data.dlc === void 0 && (missing9 = "dlc")) {
                      const err25 = {};
                      if (vErrors === null) {
                        vErrors = [err25];
                      } else {
                        vErrors.push(err25);
                      }
                      errors++;
                    } else {
                      if (data.dlc !== void 0) {
                        const _errs61 = errors;
                        if (4 !== data.dlc) {
                          const err26 = {};
                          if (vErrors === null) {
                            vErrors = [err26];
                          } else {
                            vErrors.push(err26);
                          }
                          errors++;
                        }
                        var valid26 = _errs61 === errors;
                      } else {
                        var valid26 = true;
                      }
                      if (valid26) {
                        if (data.kind !== void 0) {
                          let data24 = data.kind;
                          const _errs62 = errors;
                          if (!(
                            data24 === "classic_data" || data24 === "fd_data"
                          )) {
                            const err27 = {};
                            if (vErrors === null) {
                              vErrors = [err27];
                            } else {
                              vErrors.push(err27);
                            }
                            errors++;
                          }
                          var valid26 = _errs62 === errors;
                        } else {
                          var valid26 = true;
                        }
                      }
                    }
                  }
                  var _valid8 = _errs60 === errors;
                  errors = _errs59;
                  if (vErrors !== null) {
                    if (_errs59) {
                      vErrors.length = _errs59;
                    } else {
                      vErrors = null;
                    }
                  }
                  if (_valid8) {
                    const _errs63 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing10;
                      if (
                        data.data_hex === void 0 &&
                        (missing10 = "data_hex")
                      ) {
                        validate129.errors = [
                          {
                            instancePath,
                            schemaPath: "#/allOf/8/then/required",
                            keyword: "required",
                            params: { missingProperty: missing10 },
                            message:
                              "must have required property '" + missing10 + "'",
                          },
                        ];
                        return false;
                      } else {
                        if (data.data_hex !== void 0) {
                          let data25 = data.data_hex;
                          if (typeof data25 === "string") {
                            if (func2(data25) > 8) {
                              validate129.errors = [
                                {
                                  instancePath: instancePath + "/data_hex",
                                  schemaPath:
                                    "#/allOf/8/then/properties/data_hex/maxLength",
                                  keyword: "maxLength",
                                  params: { limit: 8 },
                                  message:
                                    "must NOT have more than 8 characters",
                                },
                              ];
                              return false;
                            } else {
                              if (func2(data25) < 8) {
                                validate129.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/8/then/properties/data_hex/minLength",
                                    keyword: "minLength",
                                    params: { limit: 8 },
                                    message:
                                      "must NOT have fewer than 8 characters",
                                  },
                                ];
                                return false;
                              }
                            }
                          }
                        }
                      }
                    }
                    var _valid8 = _errs63 === errors;
                    valid25 = _valid8;
                  }
                  if (!valid25) {
                    const err28 = {
                      instancePath,
                      schemaPath: "#/allOf/8/if",
                      keyword: "if",
                      params: { failingKeyword: "then" },
                      message: 'must match "then" schema',
                    };
                    if (vErrors === null) {
                      vErrors = [err28];
                    } else {
                      vErrors.push(err28);
                    }
                    errors++;
                    validate129.errors = vErrors;
                    return false;
                  }
                  var valid0 = _errs58 === errors;
                  if (valid0) {
                    const _errs65 = errors;
                    const _errs66 = errors;
                    let valid28 = true;
                    const _errs67 = errors;
                    if (
                      data &&
                      typeof data == "object" &&
                      !Array.isArray(data)
                    ) {
                      let missing11;
                      if (data.dlc === void 0 && (missing11 = "dlc")) {
                        const err29 = {};
                        if (vErrors === null) {
                          vErrors = [err29];
                        } else {
                          vErrors.push(err29);
                        }
                        errors++;
                      } else {
                        if (data.dlc !== void 0) {
                          const _errs68 = errors;
                          if (5 !== data.dlc) {
                            const err30 = {};
                            if (vErrors === null) {
                              vErrors = [err30];
                            } else {
                              vErrors.push(err30);
                            }
                            errors++;
                          }
                          var valid29 = _errs68 === errors;
                        } else {
                          var valid29 = true;
                        }
                        if (valid29) {
                          if (data.kind !== void 0) {
                            let data27 = data.kind;
                            const _errs69 = errors;
                            if (!(
                              data27 === "classic_data" || data27 === "fd_data"
                            )) {
                              const err31 = {};
                              if (vErrors === null) {
                                vErrors = [err31];
                              } else {
                                vErrors.push(err31);
                              }
                              errors++;
                            }
                            var valid29 = _errs69 === errors;
                          } else {
                            var valid29 = true;
                          }
                        }
                      }
                    }
                    var _valid9 = _errs67 === errors;
                    errors = _errs66;
                    if (vErrors !== null) {
                      if (_errs66) {
                        vErrors.length = _errs66;
                      } else {
                        vErrors = null;
                      }
                    }
                    if (_valid9) {
                      const _errs70 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing12;
                        if (
                          data.data_hex === void 0 &&
                          (missing12 = "data_hex")
                        ) {
                          validate129.errors = [
                            {
                              instancePath,
                              schemaPath: "#/allOf/9/then/required",
                              keyword: "required",
                              params: { missingProperty: missing12 },
                              message:
                                "must have required property '" +
                                missing12 +
                                "'",
                            },
                          ];
                          return false;
                        } else {
                          if (data.data_hex !== void 0) {
                            let data28 = data.data_hex;
                            if (typeof data28 === "string") {
                              if (func2(data28) > 10) {
                                validate129.errors = [
                                  {
                                    instancePath: instancePath + "/data_hex",
                                    schemaPath:
                                      "#/allOf/9/then/properties/data_hex/maxLength",
                                    keyword: "maxLength",
                                    params: { limit: 10 },
                                    message:
                                      "must NOT have more than 10 characters",
                                  },
                                ];
                                return false;
                              } else {
                                if (func2(data28) < 10) {
                                  validate129.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/9/then/properties/data_hex/minLength",
                                      keyword: "minLength",
                                      params: { limit: 10 },
                                      message:
                                        "must NOT have fewer than 10 characters",
                                    },
                                  ];
                                  return false;
                                }
                              }
                            }
                          }
                        }
                      }
                      var _valid9 = _errs70 === errors;
                      valid28 = _valid9;
                    }
                    if (!valid28) {
                      const err32 = {
                        instancePath,
                        schemaPath: "#/allOf/9/if",
                        keyword: "if",
                        params: { failingKeyword: "then" },
                        message: 'must match "then" schema',
                      };
                      if (vErrors === null) {
                        vErrors = [err32];
                      } else {
                        vErrors.push(err32);
                      }
                      errors++;
                      validate129.errors = vErrors;
                      return false;
                    }
                    var valid0 = _errs65 === errors;
                    if (valid0) {
                      const _errs72 = errors;
                      const _errs73 = errors;
                      let valid31 = true;
                      const _errs74 = errors;
                      if (
                        data &&
                        typeof data == "object" &&
                        !Array.isArray(data)
                      ) {
                        let missing13;
                        if (data.dlc === void 0 && (missing13 = "dlc")) {
                          const err33 = {};
                          if (vErrors === null) {
                            vErrors = [err33];
                          } else {
                            vErrors.push(err33);
                          }
                          errors++;
                        } else {
                          if (data.dlc !== void 0) {
                            const _errs75 = errors;
                            if (6 !== data.dlc) {
                              const err34 = {};
                              if (vErrors === null) {
                                vErrors = [err34];
                              } else {
                                vErrors.push(err34);
                              }
                              errors++;
                            }
                            var valid32 = _errs75 === errors;
                          } else {
                            var valid32 = true;
                          }
                          if (valid32) {
                            if (data.kind !== void 0) {
                              let data30 = data.kind;
                              const _errs76 = errors;
                              if (!(
                                data30 === "classic_data" ||
                                data30 === "fd_data"
                              )) {
                                const err35 = {};
                                if (vErrors === null) {
                                  vErrors = [err35];
                                } else {
                                  vErrors.push(err35);
                                }
                                errors++;
                              }
                              var valid32 = _errs76 === errors;
                            } else {
                              var valid32 = true;
                            }
                          }
                        }
                      }
                      var _valid10 = _errs74 === errors;
                      errors = _errs73;
                      if (vErrors !== null) {
                        if (_errs73) {
                          vErrors.length = _errs73;
                        } else {
                          vErrors = null;
                        }
                      }
                      if (_valid10) {
                        const _errs77 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing14;
                          if (
                            data.data_hex === void 0 &&
                            (missing14 = "data_hex")
                          ) {
                            validate129.errors = [
                              {
                                instancePath,
                                schemaPath: "#/allOf/10/then/required",
                                keyword: "required",
                                params: { missingProperty: missing14 },
                                message:
                                  "must have required property '" +
                                  missing14 +
                                  "'",
                              },
                            ];
                            return false;
                          } else {
                            if (data.data_hex !== void 0) {
                              let data31 = data.data_hex;
                              if (typeof data31 === "string") {
                                if (func2(data31) > 12) {
                                  validate129.errors = [
                                    {
                                      instancePath: instancePath + "/data_hex",
                                      schemaPath:
                                        "#/allOf/10/then/properties/data_hex/maxLength",
                                      keyword: "maxLength",
                                      params: { limit: 12 },
                                      message:
                                        "must NOT have more than 12 characters",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (func2(data31) < 12) {
                                    validate129.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/10/then/properties/data_hex/minLength",
                                        keyword: "minLength",
                                        params: { limit: 12 },
                                        message:
                                          "must NOT have fewer than 12 characters",
                                      },
                                    ];
                                    return false;
                                  }
                                }
                              }
                            }
                          }
                        }
                        var _valid10 = _errs77 === errors;
                        valid31 = _valid10;
                      }
                      if (!valid31) {
                        const err36 = {
                          instancePath,
                          schemaPath: "#/allOf/10/if",
                          keyword: "if",
                          params: { failingKeyword: "then" },
                          message: 'must match "then" schema',
                        };
                        if (vErrors === null) {
                          vErrors = [err36];
                        } else {
                          vErrors.push(err36);
                        }
                        errors++;
                        validate129.errors = vErrors;
                        return false;
                      }
                      var valid0 = _errs72 === errors;
                      if (valid0) {
                        const _errs79 = errors;
                        const _errs80 = errors;
                        let valid34 = true;
                        const _errs81 = errors;
                        if (
                          data &&
                          typeof data == "object" &&
                          !Array.isArray(data)
                        ) {
                          let missing15;
                          if (data.dlc === void 0 && (missing15 = "dlc")) {
                            const err37 = {};
                            if (vErrors === null) {
                              vErrors = [err37];
                            } else {
                              vErrors.push(err37);
                            }
                            errors++;
                          } else {
                            if (data.dlc !== void 0) {
                              const _errs82 = errors;
                              if (7 !== data.dlc) {
                                const err38 = {};
                                if (vErrors === null) {
                                  vErrors = [err38];
                                } else {
                                  vErrors.push(err38);
                                }
                                errors++;
                              }
                              var valid35 = _errs82 === errors;
                            } else {
                              var valid35 = true;
                            }
                            if (valid35) {
                              if (data.kind !== void 0) {
                                let data33 = data.kind;
                                const _errs83 = errors;
                                if (!(
                                  data33 === "classic_data" ||
                                  data33 === "fd_data"
                                )) {
                                  const err39 = {};
                                  if (vErrors === null) {
                                    vErrors = [err39];
                                  } else {
                                    vErrors.push(err39);
                                  }
                                  errors++;
                                }
                                var valid35 = _errs83 === errors;
                              } else {
                                var valid35 = true;
                              }
                            }
                          }
                        }
                        var _valid11 = _errs81 === errors;
                        errors = _errs80;
                        if (vErrors !== null) {
                          if (_errs80) {
                            vErrors.length = _errs80;
                          } else {
                            vErrors = null;
                          }
                        }
                        if (_valid11) {
                          const _errs84 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing16;
                            if (
                              data.data_hex === void 0 &&
                              (missing16 = "data_hex")
                            ) {
                              validate129.errors = [
                                {
                                  instancePath,
                                  schemaPath: "#/allOf/11/then/required",
                                  keyword: "required",
                                  params: { missingProperty: missing16 },
                                  message:
                                    "must have required property '" +
                                    missing16 +
                                    "'",
                                },
                              ];
                              return false;
                            } else {
                              if (data.data_hex !== void 0) {
                                let data34 = data.data_hex;
                                if (typeof data34 === "string") {
                                  if (func2(data34) > 14) {
                                    validate129.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/data_hex",
                                        schemaPath:
                                          "#/allOf/11/then/properties/data_hex/maxLength",
                                        keyword: "maxLength",
                                        params: { limit: 14 },
                                        message:
                                          "must NOT have more than 14 characters",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (func2(data34) < 14) {
                                      validate129.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/11/then/properties/data_hex/minLength",
                                          keyword: "minLength",
                                          params: { limit: 14 },
                                          message:
                                            "must NOT have fewer than 14 characters",
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                }
                              }
                            }
                          }
                          var _valid11 = _errs84 === errors;
                          valid34 = _valid11;
                        }
                        if (!valid34) {
                          const err40 = {
                            instancePath,
                            schemaPath: "#/allOf/11/if",
                            keyword: "if",
                            params: { failingKeyword: "then" },
                            message: 'must match "then" schema',
                          };
                          if (vErrors === null) {
                            vErrors = [err40];
                          } else {
                            vErrors.push(err40);
                          }
                          errors++;
                          validate129.errors = vErrors;
                          return false;
                        }
                        var valid0 = _errs79 === errors;
                        if (valid0) {
                          const _errs86 = errors;
                          const _errs87 = errors;
                          let valid37 = true;
                          const _errs88 = errors;
                          if (
                            data &&
                            typeof data == "object" &&
                            !Array.isArray(data)
                          ) {
                            let missing17;
                            if (data.dlc === void 0 && (missing17 = "dlc")) {
                              const err41 = {};
                              if (vErrors === null) {
                                vErrors = [err41];
                              } else {
                                vErrors.push(err41);
                              }
                              errors++;
                            } else {
                              if (data.dlc !== void 0) {
                                const _errs89 = errors;
                                if (8 !== data.dlc) {
                                  const err42 = {};
                                  if (vErrors === null) {
                                    vErrors = [err42];
                                  } else {
                                    vErrors.push(err42);
                                  }
                                  errors++;
                                }
                                var valid38 = _errs89 === errors;
                              } else {
                                var valid38 = true;
                              }
                              if (valid38) {
                                if (data.kind !== void 0) {
                                  let data36 = data.kind;
                                  const _errs90 = errors;
                                  if (!(
                                    data36 === "classic_data" ||
                                    data36 === "fd_data"
                                  )) {
                                    const err43 = {};
                                    if (vErrors === null) {
                                      vErrors = [err43];
                                    } else {
                                      vErrors.push(err43);
                                    }
                                    errors++;
                                  }
                                  var valid38 = _errs90 === errors;
                                } else {
                                  var valid38 = true;
                                }
                              }
                            }
                          }
                          var _valid12 = _errs88 === errors;
                          errors = _errs87;
                          if (vErrors !== null) {
                            if (_errs87) {
                              vErrors.length = _errs87;
                            } else {
                              vErrors = null;
                            }
                          }
                          if (_valid12) {
                            const _errs91 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing18;
                              if (
                                data.data_hex === void 0 &&
                                (missing18 = "data_hex")
                              ) {
                                validate129.errors = [
                                  {
                                    instancePath,
                                    schemaPath: "#/allOf/12/then/required",
                                    keyword: "required",
                                    params: { missingProperty: missing18 },
                                    message:
                                      "must have required property '" +
                                      missing18 +
                                      "'",
                                  },
                                ];
                                return false;
                              } else {
                                if (data.data_hex !== void 0) {
                                  let data37 = data.data_hex;
                                  if (typeof data37 === "string") {
                                    if (func2(data37) > 16) {
                                      validate129.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/data_hex",
                                          schemaPath:
                                            "#/allOf/12/then/properties/data_hex/maxLength",
                                          keyword: "maxLength",
                                          params: { limit: 16 },
                                          message:
                                            "must NOT have more than 16 characters",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (func2(data37) < 16) {
                                        validate129.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/12/then/properties/data_hex/minLength",
                                            keyword: "minLength",
                                            params: { limit: 16 },
                                            message:
                                              "must NOT have fewer than 16 characters",
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            var _valid12 = _errs91 === errors;
                            valid37 = _valid12;
                          }
                          if (!valid37) {
                            const err44 = {
                              instancePath,
                              schemaPath: "#/allOf/12/if",
                              keyword: "if",
                              params: { failingKeyword: "then" },
                              message: 'must match "then" schema',
                            };
                            if (vErrors === null) {
                              vErrors = [err44];
                            } else {
                              vErrors.push(err44);
                            }
                            errors++;
                            validate129.errors = vErrors;
                            return false;
                          }
                          var valid0 = _errs86 === errors;
                          if (valid0) {
                            const _errs93 = errors;
                            const _errs94 = errors;
                            let valid40 = true;
                            const _errs95 = errors;
                            if (
                              data &&
                              typeof data == "object" &&
                              !Array.isArray(data)
                            ) {
                              let missing19;
                              if (data.dlc === void 0 && (missing19 = "dlc")) {
                                const err45 = {};
                                if (vErrors === null) {
                                  vErrors = [err45];
                                } else {
                                  vErrors.push(err45);
                                }
                                errors++;
                              } else {
                                if (data.dlc !== void 0) {
                                  const _errs96 = errors;
                                  if (9 !== data.dlc) {
                                    const err46 = {};
                                    if (vErrors === null) {
                                      vErrors = [err46];
                                    } else {
                                      vErrors.push(err46);
                                    }
                                    errors++;
                                  }
                                  var valid41 = _errs96 === errors;
                                } else {
                                  var valid41 = true;
                                }
                                if (valid41) {
                                  if (data.kind !== void 0) {
                                    let data39 = data.kind;
                                    const _errs97 = errors;
                                    if (!(
                                      data39 === "classic_data" ||
                                      data39 === "fd_data"
                                    )) {
                                      const err47 = {};
                                      if (vErrors === null) {
                                        vErrors = [err47];
                                      } else {
                                        vErrors.push(err47);
                                      }
                                      errors++;
                                    }
                                    var valid41 = _errs97 === errors;
                                  } else {
                                    var valid41 = true;
                                  }
                                }
                              }
                            }
                            var _valid13 = _errs95 === errors;
                            errors = _errs94;
                            if (vErrors !== null) {
                              if (_errs94) {
                                vErrors.length = _errs94;
                              } else {
                                vErrors = null;
                              }
                            }
                            if (_valid13) {
                              const _errs98 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing20;
                                if (
                                  data.data_hex === void 0 &&
                                  (missing20 = "data_hex")
                                ) {
                                  validate129.errors = [
                                    {
                                      instancePath,
                                      schemaPath: "#/allOf/13/then/required",
                                      keyword: "required",
                                      params: { missingProperty: missing20 },
                                      message:
                                        "must have required property '" +
                                        missing20 +
                                        "'",
                                    },
                                  ];
                                  return false;
                                } else {
                                  if (data.data_hex !== void 0) {
                                    let data40 = data.data_hex;
                                    if (typeof data40 === "string") {
                                      if (func2(data40) > 24) {
                                        validate129.errors = [
                                          {
                                            instancePath:
                                              instancePath + "/data_hex",
                                            schemaPath:
                                              "#/allOf/13/then/properties/data_hex/maxLength",
                                            keyword: "maxLength",
                                            params: { limit: 24 },
                                            message:
                                              "must NOT have more than 24 characters",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (func2(data40) < 24) {
                                          validate129.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/13/then/properties/data_hex/minLength",
                                              keyword: "minLength",
                                              params: { limit: 24 },
                                              message:
                                                "must NOT have fewer than 24 characters",
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              var _valid13 = _errs98 === errors;
                              valid40 = _valid13;
                            }
                            if (!valid40) {
                              const err48 = {
                                instancePath,
                                schemaPath: "#/allOf/13/if",
                                keyword: "if",
                                params: { failingKeyword: "then" },
                                message: 'must match "then" schema',
                              };
                              if (vErrors === null) {
                                vErrors = [err48];
                              } else {
                                vErrors.push(err48);
                              }
                              errors++;
                              validate129.errors = vErrors;
                              return false;
                            }
                            var valid0 = _errs93 === errors;
                            if (valid0) {
                              const _errs100 = errors;
                              const _errs101 = errors;
                              let valid43 = true;
                              const _errs102 = errors;
                              if (
                                data &&
                                typeof data == "object" &&
                                !Array.isArray(data)
                              ) {
                                let missing21;
                                if (
                                  data.dlc === void 0 &&
                                  (missing21 = "dlc")
                                ) {
                                  const err49 = {};
                                  if (vErrors === null) {
                                    vErrors = [err49];
                                  } else {
                                    vErrors.push(err49);
                                  }
                                  errors++;
                                } else {
                                  if (data.dlc !== void 0) {
                                    const _errs103 = errors;
                                    if (10 !== data.dlc) {
                                      const err50 = {};
                                      if (vErrors === null) {
                                        vErrors = [err50];
                                      } else {
                                        vErrors.push(err50);
                                      }
                                      errors++;
                                    }
                                    var valid44 = _errs103 === errors;
                                  } else {
                                    var valid44 = true;
                                  }
                                  if (valid44) {
                                    if (data.kind !== void 0) {
                                      let data42 = data.kind;
                                      const _errs104 = errors;
                                      if (!(
                                        data42 === "classic_data" ||
                                        data42 === "fd_data"
                                      )) {
                                        const err51 = {};
                                        if (vErrors === null) {
                                          vErrors = [err51];
                                        } else {
                                          vErrors.push(err51);
                                        }
                                        errors++;
                                      }
                                      var valid44 = _errs104 === errors;
                                    } else {
                                      var valid44 = true;
                                    }
                                  }
                                }
                              }
                              var _valid14 = _errs102 === errors;
                              errors = _errs101;
                              if (vErrors !== null) {
                                if (_errs101) {
                                  vErrors.length = _errs101;
                                } else {
                                  vErrors = null;
                                }
                              }
                              if (_valid14) {
                                const _errs105 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing22;
                                  if (
                                    data.data_hex === void 0 &&
                                    (missing22 = "data_hex")
                                  ) {
                                    validate129.errors = [
                                      {
                                        instancePath,
                                        schemaPath: "#/allOf/14/then/required",
                                        keyword: "required",
                                        params: { missingProperty: missing22 },
                                        message:
                                          "must have required property '" +
                                          missing22 +
                                          "'",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    if (data.data_hex !== void 0) {
                                      let data43 = data.data_hex;
                                      if (typeof data43 === "string") {
                                        if (func2(data43) > 32) {
                                          validate129.errors = [
                                            {
                                              instancePath:
                                                instancePath + "/data_hex",
                                              schemaPath:
                                                "#/allOf/14/then/properties/data_hex/maxLength",
                                              keyword: "maxLength",
                                              params: { limit: 32 },
                                              message:
                                                "must NOT have more than 32 characters",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (func2(data43) < 32) {
                                            validate129.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/14/then/properties/data_hex/minLength",
                                                keyword: "minLength",
                                                params: { limit: 32 },
                                                message:
                                                  "must NOT have fewer than 32 characters",
                                              },
                                            ];
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                var _valid14 = _errs105 === errors;
                                valid43 = _valid14;
                              }
                              if (!valid43) {
                                const err52 = {
                                  instancePath,
                                  schemaPath: "#/allOf/14/if",
                                  keyword: "if",
                                  params: { failingKeyword: "then" },
                                  message: 'must match "then" schema',
                                };
                                if (vErrors === null) {
                                  vErrors = [err52];
                                } else {
                                  vErrors.push(err52);
                                }
                                errors++;
                                validate129.errors = vErrors;
                                return false;
                              }
                              var valid0 = _errs100 === errors;
                              if (valid0) {
                                const _errs107 = errors;
                                const _errs108 = errors;
                                let valid46 = true;
                                const _errs109 = errors;
                                if (
                                  data &&
                                  typeof data == "object" &&
                                  !Array.isArray(data)
                                ) {
                                  let missing23;
                                  if (
                                    data.dlc === void 0 &&
                                    (missing23 = "dlc")
                                  ) {
                                    const err53 = {};
                                    if (vErrors === null) {
                                      vErrors = [err53];
                                    } else {
                                      vErrors.push(err53);
                                    }
                                    errors++;
                                  } else {
                                    if (data.dlc !== void 0) {
                                      const _errs110 = errors;
                                      if (11 !== data.dlc) {
                                        const err54 = {};
                                        if (vErrors === null) {
                                          vErrors = [err54];
                                        } else {
                                          vErrors.push(err54);
                                        }
                                        errors++;
                                      }
                                      var valid47 = _errs110 === errors;
                                    } else {
                                      var valid47 = true;
                                    }
                                    if (valid47) {
                                      if (data.kind !== void 0) {
                                        let data45 = data.kind;
                                        const _errs111 = errors;
                                        if (!(
                                          data45 === "classic_data" ||
                                          data45 === "fd_data"
                                        )) {
                                          const err55 = {};
                                          if (vErrors === null) {
                                            vErrors = [err55];
                                          } else {
                                            vErrors.push(err55);
                                          }
                                          errors++;
                                        }
                                        var valid47 = _errs111 === errors;
                                      } else {
                                        var valid47 = true;
                                      }
                                    }
                                  }
                                }
                                var _valid15 = _errs109 === errors;
                                errors = _errs108;
                                if (vErrors !== null) {
                                  if (_errs108) {
                                    vErrors.length = _errs108;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                                if (_valid15) {
                                  const _errs112 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing24;
                                    if (
                                      data.data_hex === void 0 &&
                                      (missing24 = "data_hex")
                                    ) {
                                      validate129.errors = [
                                        {
                                          instancePath,
                                          schemaPath:
                                            "#/allOf/15/then/required",
                                          keyword: "required",
                                          params: {
                                            missingProperty: missing24,
                                          },
                                          message:
                                            "must have required property '" +
                                            missing24 +
                                            "'",
                                        },
                                      ];
                                      return false;
                                    } else {
                                      if (data.data_hex !== void 0) {
                                        let data46 = data.data_hex;
                                        if (typeof data46 === "string") {
                                          if (func2(data46) > 40) {
                                            validate129.errors = [
                                              {
                                                instancePath:
                                                  instancePath + "/data_hex",
                                                schemaPath:
                                                  "#/allOf/15/then/properties/data_hex/maxLength",
                                                keyword: "maxLength",
                                                params: { limit: 40 },
                                                message:
                                                  "must NOT have more than 40 characters",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (func2(data46) < 40) {
                                              validate129.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/15/then/properties/data_hex/minLength",
                                                  keyword: "minLength",
                                                  params: { limit: 40 },
                                                  message:
                                                    "must NOT have fewer than 40 characters",
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  var _valid15 = _errs112 === errors;
                                  valid46 = _valid15;
                                }
                                if (!valid46) {
                                  const err56 = {
                                    instancePath,
                                    schemaPath: "#/allOf/15/if",
                                    keyword: "if",
                                    params: { failingKeyword: "then" },
                                    message: 'must match "then" schema',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err56];
                                  } else {
                                    vErrors.push(err56);
                                  }
                                  errors++;
                                  validate129.errors = vErrors;
                                  return false;
                                }
                                var valid0 = _errs107 === errors;
                                if (valid0) {
                                  const _errs114 = errors;
                                  const _errs115 = errors;
                                  let valid49 = true;
                                  const _errs116 = errors;
                                  if (
                                    data &&
                                    typeof data == "object" &&
                                    !Array.isArray(data)
                                  ) {
                                    let missing25;
                                    if (
                                      data.dlc === void 0 &&
                                      (missing25 = "dlc")
                                    ) {
                                      const err57 = {};
                                      if (vErrors === null) {
                                        vErrors = [err57];
                                      } else {
                                        vErrors.push(err57);
                                      }
                                      errors++;
                                    } else {
                                      if (data.dlc !== void 0) {
                                        const _errs117 = errors;
                                        if (12 !== data.dlc) {
                                          const err58 = {};
                                          if (vErrors === null) {
                                            vErrors = [err58];
                                          } else {
                                            vErrors.push(err58);
                                          }
                                          errors++;
                                        }
                                        var valid50 = _errs117 === errors;
                                      } else {
                                        var valid50 = true;
                                      }
                                      if (valid50) {
                                        if (data.kind !== void 0) {
                                          let data48 = data.kind;
                                          const _errs118 = errors;
                                          if (!(
                                            data48 === "classic_data" ||
                                            data48 === "fd_data"
                                          )) {
                                            const err59 = {};
                                            if (vErrors === null) {
                                              vErrors = [err59];
                                            } else {
                                              vErrors.push(err59);
                                            }
                                            errors++;
                                          }
                                          var valid50 = _errs118 === errors;
                                        } else {
                                          var valid50 = true;
                                        }
                                      }
                                    }
                                  }
                                  var _valid16 = _errs116 === errors;
                                  errors = _errs115;
                                  if (vErrors !== null) {
                                    if (_errs115) {
                                      vErrors.length = _errs115;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                  if (_valid16) {
                                    const _errs119 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing26;
                                      if (
                                        data.data_hex === void 0 &&
                                        (missing26 = "data_hex")
                                      ) {
                                        validate129.errors = [
                                          {
                                            instancePath,
                                            schemaPath:
                                              "#/allOf/16/then/required",
                                            keyword: "required",
                                            params: {
                                              missingProperty: missing26,
                                            },
                                            message:
                                              "must have required property '" +
                                              missing26 +
                                              "'",
                                          },
                                        ];
                                        return false;
                                      } else {
                                        if (data.data_hex !== void 0) {
                                          let data49 = data.data_hex;
                                          if (typeof data49 === "string") {
                                            if (func2(data49) > 48) {
                                              validate129.errors = [
                                                {
                                                  instancePath:
                                                    instancePath + "/data_hex",
                                                  schemaPath:
                                                    "#/allOf/16/then/properties/data_hex/maxLength",
                                                  keyword: "maxLength",
                                                  params: { limit: 48 },
                                                  message:
                                                    "must NOT have more than 48 characters",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (func2(data49) < 48) {
                                                validate129.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/16/then/properties/data_hex/minLength",
                                                    keyword: "minLength",
                                                    params: { limit: 48 },
                                                    message:
                                                      "must NOT have fewer than 48 characters",
                                                  },
                                                ];
                                                return false;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                    var _valid16 = _errs119 === errors;
                                    valid49 = _valid16;
                                  }
                                  if (!valid49) {
                                    const err60 = {
                                      instancePath,
                                      schemaPath: "#/allOf/16/if",
                                      keyword: "if",
                                      params: { failingKeyword: "then" },
                                      message: 'must match "then" schema',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err60];
                                    } else {
                                      vErrors.push(err60);
                                    }
                                    errors++;
                                    validate129.errors = vErrors;
                                    return false;
                                  }
                                  var valid0 = _errs114 === errors;
                                  if (valid0) {
                                    const _errs121 = errors;
                                    const _errs122 = errors;
                                    let valid52 = true;
                                    const _errs123 = errors;
                                    if (
                                      data &&
                                      typeof data == "object" &&
                                      !Array.isArray(data)
                                    ) {
                                      let missing27;
                                      if (
                                        data.dlc === void 0 &&
                                        (missing27 = "dlc")
                                      ) {
                                        const err61 = {};
                                        if (vErrors === null) {
                                          vErrors = [err61];
                                        } else {
                                          vErrors.push(err61);
                                        }
                                        errors++;
                                      } else {
                                        if (data.dlc !== void 0) {
                                          const _errs124 = errors;
                                          if (13 !== data.dlc) {
                                            const err62 = {};
                                            if (vErrors === null) {
                                              vErrors = [err62];
                                            } else {
                                              vErrors.push(err62);
                                            }
                                            errors++;
                                          }
                                          var valid53 = _errs124 === errors;
                                        } else {
                                          var valid53 = true;
                                        }
                                        if (valid53) {
                                          if (data.kind !== void 0) {
                                            let data51 = data.kind;
                                            const _errs125 = errors;
                                            if (!(
                                              data51 === "classic_data" ||
                                              data51 === "fd_data"
                                            )) {
                                              const err63 = {};
                                              if (vErrors === null) {
                                                vErrors = [err63];
                                              } else {
                                                vErrors.push(err63);
                                              }
                                              errors++;
                                            }
                                            var valid53 = _errs125 === errors;
                                          } else {
                                            var valid53 = true;
                                          }
                                        }
                                      }
                                    }
                                    var _valid17 = _errs123 === errors;
                                    errors = _errs122;
                                    if (vErrors !== null) {
                                      if (_errs122) {
                                        vErrors.length = _errs122;
                                      } else {
                                        vErrors = null;
                                      }
                                    }
                                    if (_valid17) {
                                      const _errs126 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing28;
                                        if (
                                          data.data_hex === void 0 &&
                                          (missing28 = "data_hex")
                                        ) {
                                          validate129.errors = [
                                            {
                                              instancePath,
                                              schemaPath:
                                                "#/allOf/17/then/required",
                                              keyword: "required",
                                              params: {
                                                missingProperty: missing28,
                                              },
                                              message:
                                                "must have required property '" +
                                                missing28 +
                                                "'",
                                            },
                                          ];
                                          return false;
                                        } else {
                                          if (data.data_hex !== void 0) {
                                            let data52 = data.data_hex;
                                            if (typeof data52 === "string") {
                                              if (func2(data52) > 64) {
                                                validate129.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/data_hex",
                                                    schemaPath:
                                                      "#/allOf/17/then/properties/data_hex/maxLength",
                                                    keyword: "maxLength",
                                                    params: { limit: 64 },
                                                    message:
                                                      "must NOT have more than 64 characters",
                                                  },
                                                ];
                                                return false;
                                              } else {
                                                if (func2(data52) < 64) {
                                                  validate129.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/17/then/properties/data_hex/minLength",
                                                      keyword: "minLength",
                                                      params: { limit: 64 },
                                                      message:
                                                        "must NOT have fewer than 64 characters",
                                                    },
                                                  ];
                                                  return false;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                      var _valid17 = _errs126 === errors;
                                      valid52 = _valid17;
                                    }
                                    if (!valid52) {
                                      const err64 = {
                                        instancePath,
                                        schemaPath: "#/allOf/17/if",
                                        keyword: "if",
                                        params: { failingKeyword: "then" },
                                        message: 'must match "then" schema',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err64];
                                      } else {
                                        vErrors.push(err64);
                                      }
                                      errors++;
                                      validate129.errors = vErrors;
                                      return false;
                                    }
                                    var valid0 = _errs121 === errors;
                                    if (valid0) {
                                      const _errs128 = errors;
                                      const _errs129 = errors;
                                      let valid55 = true;
                                      const _errs130 = errors;
                                      if (
                                        data &&
                                        typeof data == "object" &&
                                        !Array.isArray(data)
                                      ) {
                                        let missing29;
                                        if (
                                          data.dlc === void 0 &&
                                          (missing29 = "dlc")
                                        ) {
                                          const err65 = {};
                                          if (vErrors === null) {
                                            vErrors = [err65];
                                          } else {
                                            vErrors.push(err65);
                                          }
                                          errors++;
                                        } else {
                                          if (data.dlc !== void 0) {
                                            const _errs131 = errors;
                                            if (14 !== data.dlc) {
                                              const err66 = {};
                                              if (vErrors === null) {
                                                vErrors = [err66];
                                              } else {
                                                vErrors.push(err66);
                                              }
                                              errors++;
                                            }
                                            var valid56 = _errs131 === errors;
                                          } else {
                                            var valid56 = true;
                                          }
                                          if (valid56) {
                                            if (data.kind !== void 0) {
                                              let data54 = data.kind;
                                              const _errs132 = errors;
                                              if (!(
                                                data54 === "classic_data" ||
                                                data54 === "fd_data"
                                              )) {
                                                const err67 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err67];
                                                } else {
                                                  vErrors.push(err67);
                                                }
                                                errors++;
                                              }
                                              var valid56 = _errs132 === errors;
                                            } else {
                                              var valid56 = true;
                                            }
                                          }
                                        }
                                      }
                                      var _valid18 = _errs130 === errors;
                                      errors = _errs129;
                                      if (vErrors !== null) {
                                        if (_errs129) {
                                          vErrors.length = _errs129;
                                        } else {
                                          vErrors = null;
                                        }
                                      }
                                      if (_valid18) {
                                        const _errs133 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing30;
                                          if (
                                            data.data_hex === void 0 &&
                                            (missing30 = "data_hex")
                                          ) {
                                            validate129.errors = [
                                              {
                                                instancePath,
                                                schemaPath:
                                                  "#/allOf/18/then/required",
                                                keyword: "required",
                                                params: {
                                                  missingProperty: missing30,
                                                },
                                                message:
                                                  "must have required property '" +
                                                  missing30 +
                                                  "'",
                                              },
                                            ];
                                            return false;
                                          } else {
                                            if (data.data_hex !== void 0) {
                                              let data55 = data.data_hex;
                                              if (typeof data55 === "string") {
                                                if (func2(data55) > 96) {
                                                  validate129.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        "/data_hex",
                                                      schemaPath:
                                                        "#/allOf/18/then/properties/data_hex/maxLength",
                                                      keyword: "maxLength",
                                                      params: { limit: 96 },
                                                      message:
                                                        "must NOT have more than 96 characters",
                                                    },
                                                  ];
                                                  return false;
                                                } else {
                                                  if (func2(data55) < 96) {
                                                    validate129.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/18/then/properties/data_hex/minLength",
                                                        keyword: "minLength",
                                                        params: { limit: 96 },
                                                        message:
                                                          "must NOT have fewer than 96 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                        var _valid18 = _errs133 === errors;
                                        valid55 = _valid18;
                                      }
                                      if (!valid55) {
                                        const err68 = {
                                          instancePath,
                                          schemaPath: "#/allOf/18/if",
                                          keyword: "if",
                                          params: { failingKeyword: "then" },
                                          message: 'must match "then" schema',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err68];
                                        } else {
                                          vErrors.push(err68);
                                        }
                                        errors++;
                                        validate129.errors = vErrors;
                                        return false;
                                      }
                                      var valid0 = _errs128 === errors;
                                      if (valid0) {
                                        const _errs135 = errors;
                                        const _errs136 = errors;
                                        let valid58 = true;
                                        const _errs137 = errors;
                                        if (
                                          data &&
                                          typeof data == "object" &&
                                          !Array.isArray(data)
                                        ) {
                                          let missing31;
                                          if (
                                            data.dlc === void 0 &&
                                            (missing31 = "dlc")
                                          ) {
                                            const err69 = {};
                                            if (vErrors === null) {
                                              vErrors = [err69];
                                            } else {
                                              vErrors.push(err69);
                                            }
                                            errors++;
                                          } else {
                                            if (data.dlc !== void 0) {
                                              const _errs138 = errors;
                                              if (15 !== data.dlc) {
                                                const err70 = {};
                                                if (vErrors === null) {
                                                  vErrors = [err70];
                                                } else {
                                                  vErrors.push(err70);
                                                }
                                                errors++;
                                              }
                                              var valid59 = _errs138 === errors;
                                            } else {
                                              var valid59 = true;
                                            }
                                            if (valid59) {
                                              if (data.kind !== void 0) {
                                                let data57 = data.kind;
                                                const _errs139 = errors;
                                                if (!(
                                                  data57 === "classic_data" ||
                                                  data57 === "fd_data"
                                                )) {
                                                  const err71 = {};
                                                  if (vErrors === null) {
                                                    vErrors = [err71];
                                                  } else {
                                                    vErrors.push(err71);
                                                  }
                                                  errors++;
                                                }
                                                var valid59 =
                                                  _errs139 === errors;
                                              } else {
                                                var valid59 = true;
                                              }
                                            }
                                          }
                                        }
                                        var _valid19 = _errs137 === errors;
                                        errors = _errs136;
                                        if (vErrors !== null) {
                                          if (_errs136) {
                                            vErrors.length = _errs136;
                                          } else {
                                            vErrors = null;
                                          }
                                        }
                                        if (_valid19) {
                                          const _errs140 = errors;
                                          if (
                                            data &&
                                            typeof data == "object" &&
                                            !Array.isArray(data)
                                          ) {
                                            let missing32;
                                            if (
                                              data.data_hex === void 0 &&
                                              (missing32 = "data_hex")
                                            ) {
                                              validate129.errors = [
                                                {
                                                  instancePath,
                                                  schemaPath:
                                                    "#/allOf/19/then/required",
                                                  keyword: "required",
                                                  params: {
                                                    missingProperty: missing32,
                                                  },
                                                  message:
                                                    "must have required property '" +
                                                    missing32 +
                                                    "'",
                                                },
                                              ];
                                              return false;
                                            } else {
                                              if (data.data_hex !== void 0) {
                                                let data58 = data.data_hex;
                                                if (
                                                  typeof data58 === "string"
                                                ) {
                                                  if (func2(data58) > 128) {
                                                    validate129.errors = [
                                                      {
                                                        instancePath:
                                                          instancePath +
                                                          "/data_hex",
                                                        schemaPath:
                                                          "#/allOf/19/then/properties/data_hex/maxLength",
                                                        keyword: "maxLength",
                                                        params: { limit: 128 },
                                                        message:
                                                          "must NOT have more than 128 characters",
                                                      },
                                                    ];
                                                    return false;
                                                  } else {
                                                    if (func2(data58) < 128) {
                                                      validate129.errors = [
                                                        {
                                                          instancePath:
                                                            instancePath +
                                                            "/data_hex",
                                                          schemaPath:
                                                            "#/allOf/19/then/properties/data_hex/minLength",
                                                          keyword: "minLength",
                                                          params: {
                                                            limit: 128,
                                                          },
                                                          message:
                                                            "must NOT have fewer than 128 characters",
                                                        },
                                                      ];
                                                      return false;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                          var _valid19 = _errs140 === errors;
                                          valid58 = _valid19;
                                        }
                                        if (!valid58) {
                                          const err72 = {
                                            instancePath,
                                            schemaPath: "#/allOf/19/if",
                                            keyword: "if",
                                            params: { failingKeyword: "then" },
                                            message: 'must match "then" schema',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err72];
                                          } else {
                                            vErrors.push(err72);
                                          }
                                          errors++;
                                          validate129.errors = vErrors;
                                          return false;
                                        }
                                        var valid0 = _errs135 === errors;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing33;
      if (
        (data.kind === void 0 && (missing33 = "kind")) ||
        (data.id === void 0 && (missing33 = "id")) ||
        (data.extended === void 0 && (missing33 = "extended")) ||
        (data.brs === void 0 && (missing33 = "brs")) ||
        (data.esi === void 0 && (missing33 = "esi")) ||
        (data.data_hex === void 0 && (missing33 = "data_hex")) ||
        (data.dlc === void 0 && (missing33 = "dlc"))
      ) {
        validate129.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing33 },
            message: "must have required property '" + missing33 + "'",
          },
        ];
        return false;
      } else {
        if (data.brs !== void 0) {
          const _errs142 = errors;
          if (typeof data.brs !== "boolean") {
            validate129.errors = [
              {
                instancePath: instancePath + "/brs",
                schemaPath: "#/properties/brs/type",
                keyword: "type",
                params: { type: "boolean" },
                message: "must be boolean",
              },
            ];
            return false;
          }
          var valid61 = _errs142 === errors;
        } else {
          var valid61 = true;
        }
        if (valid61) {
          if (data.data_hex !== void 0) {
            let data60 = data.data_hex;
            const _errs144 = errors;
            if (errors === _errs144) {
              if (typeof data60 === "string") {
                if (func2(data60) > 128) {
                  validate129.errors = [
                    {
                      instancePath: instancePath + "/data_hex",
                      schemaPath: "#/properties/data_hex/maxLength",
                      keyword: "maxLength",
                      params: { limit: 128 },
                      message: "must NOT have more than 128 characters",
                    },
                  ];
                  return false;
                } else {
                  if (!pattern2.test(data60)) {
                    validate129.errors = [
                      {
                        instancePath: instancePath + "/data_hex",
                        schemaPath: "#/properties/data_hex/pattern",
                        keyword: "pattern",
                        params: { pattern: "^([0-9A-Fa-f]{2})*$" },
                        message: 'must match pattern "^([0-9A-Fa-f]{2})*$"',
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate129.errors = [
                  {
                    instancePath: instancePath + "/data_hex",
                    schemaPath: "#/properties/data_hex/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
            }
            var valid61 = _errs144 === errors;
          } else {
            var valid61 = true;
          }
          if (valid61) {
            if (data.dlc !== void 0) {
              let data61 = data.dlc;
              const _errs146 = errors;
              if (!(
                typeof data61 == "number" &&
                !(data61 % 1) &&
                !isNaN(data61)
              )) {
                validate129.errors = [
                  {
                    instancePath: instancePath + "/dlc",
                    schemaPath: "#/properties/dlc/type",
                    keyword: "type",
                    params: { type: "integer" },
                    message: "must be integer",
                  },
                ];
                return false;
              }
              if (errors === _errs146) {
                if (typeof data61 == "number") {
                  if (data61 > 255 || isNaN(data61)) {
                    validate129.errors = [
                      {
                        instancePath: instancePath + "/dlc",
                        schemaPath: "#/properties/dlc/maximum",
                        keyword: "maximum",
                        params: { comparison: "<=", limit: 255 },
                        message: "must be <= 255",
                      },
                    ];
                    return false;
                  } else {
                    if (data61 < 0 || isNaN(data61)) {
                      validate129.errors = [
                        {
                          instancePath: instancePath + "/dlc",
                          schemaPath: "#/properties/dlc/minimum",
                          keyword: "minimum",
                          params: { comparison: ">=", limit: 0 },
                          message: "must be >= 0",
                        },
                      ];
                      return false;
                    }
                  }
                }
              }
              var valid61 = _errs146 === errors;
            } else {
              var valid61 = true;
            }
            if (valid61) {
              if (data.esi !== void 0) {
                const _errs148 = errors;
                if (typeof data.esi !== "boolean") {
                  validate129.errors = [
                    {
                      instancePath: instancePath + "/esi",
                      schemaPath: "#/properties/esi/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    },
                  ];
                  return false;
                }
                var valid61 = _errs148 === errors;
              } else {
                var valid61 = true;
              }
              if (valid61) {
                if (data.extended !== void 0) {
                  const _errs150 = errors;
                  if (typeof data.extended !== "boolean") {
                    validate129.errors = [
                      {
                        instancePath: instancePath + "/extended",
                        schemaPath: "#/properties/extended/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid61 = _errs150 === errors;
                } else {
                  var valid61 = true;
                }
                if (valid61) {
                  if (data.id !== void 0) {
                    let data64 = data.id;
                    const _errs152 = errors;
                    if (!(
                      typeof data64 == "number" &&
                      !(data64 % 1) &&
                      !isNaN(data64)
                    )) {
                      validate129.errors = [
                        {
                          instancePath: instancePath + "/id",
                          schemaPath: "#/properties/id/type",
                          keyword: "type",
                          params: { type: "integer" },
                          message: "must be integer",
                        },
                      ];
                      return false;
                    }
                    if (errors === _errs152) {
                      if (typeof data64 == "number") {
                        if (data64 > 536870911 || isNaN(data64)) {
                          validate129.errors = [
                            {
                              instancePath: instancePath + "/id",
                              schemaPath: "#/properties/id/maximum",
                              keyword: "maximum",
                              params: { comparison: "<=", limit: 536870911 },
                              message: "must be <= 536870911",
                            },
                          ];
                          return false;
                        } else {
                          if (data64 < 0 || isNaN(data64)) {
                            validate129.errors = [
                              {
                                instancePath: instancePath + "/id",
                                schemaPath: "#/properties/id/minimum",
                                keyword: "minimum",
                                params: { comparison: ">=", limit: 0 },
                                message: "must be >= 0",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                    }
                    var valid61 = _errs152 === errors;
                  } else {
                    var valid61 = true;
                  }
                  if (valid61) {
                    if (data.kind !== void 0) {
                      const _errs154 = errors;
                      if (
                        !validate82(data.kind, {
                          instancePath: instancePath + "/kind",
                          parentData: data,
                          parentDataProperty: "kind",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate82.errors
                            : vErrors.concat(validate82.errors);
                        errors = vErrors.length;
                      }
                      var valid61 = _errs154 === errors;
                    } else {
                      var valid61 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate129.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate129.errors = vErrors;
  return errors === 0;
}
var schema48 = {
  type: "string",
  enum: ["host_only", "hardware_unmapped", "uncertain"],
};
function validate135(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate135.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "host_only" ||
    data === "hardware_unmapped" ||
    data === "uncertain"
  )) {
    validate135.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema48.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate135.errors = vErrors;
  return errors === 0;
}
function validate125(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (errors === _errs1) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.type === void 0 && (missing0 = "type")) ||
        (data.sequence === void 0 && (missing0 = "sequence")) ||
        (data.host_monotonic_ns === void 0 &&
          (missing0 = "host_monotonic_ns")) ||
        (data.timestamp_quality === void 0 &&
          (missing0 = "timestamp_quality")) ||
        (data.timestamp_epoch === void 0 && (missing0 = "timestamp_epoch")) ||
        (data.direction === void 0 && (missing0 = "direction")) ||
        (data.frame === void 0 && (missing0 = "frame"))
      ) {
        const err0 = {
          instancePath,
          schemaPath: "#/oneOf/0/required",
          keyword: "required",
          params: { missingProperty: missing0 },
          message: "must have required property '" + missing0 + "'",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      } else {
        if (data.device_raw_timestamp_us !== void 0) {
          let data0 = data.device_raw_timestamp_us;
          const _errs3 = errors;
          if (
            !(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0)) &&
            data0 !== null
          ) {
            const err1 = {
              instancePath: instancePath + "/device_raw_timestamp_us",
              schemaPath: "#/oneOf/0/properties/device_raw_timestamp_us/type",
              keyword: "type",
              params: {
                type: schema45.oneOf[0].properties.device_raw_timestamp_us.type,
              },
              message: "must be integer,null",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (errors === _errs3) {
            if (typeof data0 == "number") {
              if (data0 < 0 || isNaN(data0)) {
                const err2 = {
                  instancePath: instancePath + "/device_raw_timestamp_us",
                  schemaPath:
                    "#/oneOf/0/properties/device_raw_timestamp_us/minimum",
                  keyword: "minimum",
                  params: { comparison: ">=", limit: 0 },
                  message: "must be >= 0",
                };
                if (vErrors === null) {
                  vErrors = [err2];
                } else {
                  vErrors.push(err2);
                }
                errors++;
              }
            }
          }
          var valid1 = _errs3 === errors;
        } else {
          var valid1 = true;
        }
        if (valid1) {
          if (data.device_timestamp_us !== void 0) {
            let data1 = data.device_timestamp_us;
            const _errs5 = errors;
            const _errs6 = errors;
            let valid2 = false;
            const _errs7 = errors;
            if (
              !validate30(data1, {
                instancePath: instancePath + "/device_timestamp_us",
                parentData: data,
                parentDataProperty: "device_timestamp_us",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate30.errors
                  : vErrors.concat(validate30.errors);
              errors = vErrors.length;
            }
            var _valid1 = _errs7 === errors;
            valid2 = valid2 || _valid1;
            if (!valid2) {
              const _errs8 = errors;
              if (data1 !== null) {
                const err3 = {
                  instancePath: instancePath + "/device_timestamp_us",
                  schemaPath:
                    "#/oneOf/0/properties/device_timestamp_us/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err3];
                } else {
                  vErrors.push(err3);
                }
                errors++;
              }
              var _valid1 = _errs8 === errors;
              valid2 = valid2 || _valid1;
            }
            if (!valid2) {
              const err4 = {
                instancePath: instancePath + "/device_timestamp_us",
                schemaPath: "#/oneOf/0/properties/device_timestamp_us/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            } else {
              errors = _errs6;
              if (vErrors !== null) {
                if (_errs6) {
                  vErrors.length = _errs6;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid1 = _errs5 === errors;
          } else {
            var valid1 = true;
          }
          if (valid1) {
            if (data.direction !== void 0) {
              const _errs10 = errors;
              if (
                !validate127(data.direction, {
                  instancePath: instancePath + "/direction",
                  parentData: data,
                  parentDataProperty: "direction",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate127.errors
                    : vErrors.concat(validate127.errors);
                errors = vErrors.length;
              }
              var valid1 = _errs10 === errors;
            } else {
              var valid1 = true;
            }
            if (valid1) {
              if (data.frame !== void 0) {
                const _errs11 = errors;
                if (
                  !validate129(data.frame, {
                    instancePath: instancePath + "/frame",
                    parentData: data,
                    parentDataProperty: "frame",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate129.errors
                      : vErrors.concat(validate129.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs11 === errors;
              } else {
                var valid1 = true;
              }
              if (valid1) {
                if (data.host_monotonic_ns !== void 0) {
                  const _errs12 = errors;
                  if (
                    !validate30(data.host_monotonic_ns, {
                      instancePath: instancePath + "/host_monotonic_ns",
                      parentData: data,
                      parentDataProperty: "host_monotonic_ns",
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate30.errors
                        : vErrors.concat(validate30.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs12 === errors;
                } else {
                  var valid1 = true;
                }
                if (valid1) {
                  if (data.raw_dlc !== void 0) {
                    let data5 = data.raw_dlc;
                    const _errs13 = errors;
                    if (
                      !(
                        typeof data5 == "number" &&
                        !(data5 % 1) &&
                        !isNaN(data5)
                      ) &&
                      data5 !== null
                    ) {
                      const err5 = {
                        instancePath: instancePath + "/raw_dlc",
                        schemaPath: "#/oneOf/0/properties/raw_dlc/type",
                        keyword: "type",
                        params: {
                          type: schema45.oneOf[0].properties.raw_dlc.type,
                        },
                        message: "must be integer,null",
                      };
                      if (vErrors === null) {
                        vErrors = [err5];
                      } else {
                        vErrors.push(err5);
                      }
                      errors++;
                    }
                    if (errors === _errs13) {
                      if (typeof data5 == "number") {
                        if (data5 > 255 || isNaN(data5)) {
                          const err6 = {
                            instancePath: instancePath + "/raw_dlc",
                            schemaPath: "#/oneOf/0/properties/raw_dlc/maximum",
                            keyword: "maximum",
                            params: { comparison: "<=", limit: 255 },
                            message: "must be <= 255",
                          };
                          if (vErrors === null) {
                            vErrors = [err6];
                          } else {
                            vErrors.push(err6);
                          }
                          errors++;
                        } else {
                          if (data5 < 0 || isNaN(data5)) {
                            const err7 = {
                              instancePath: instancePath + "/raw_dlc",
                              schemaPath:
                                "#/oneOf/0/properties/raw_dlc/minimum",
                              keyword: "minimum",
                              params: { comparison: ">=", limit: 0 },
                              message: "must be >= 0",
                            };
                            if (vErrors === null) {
                              vErrors = [err7];
                            } else {
                              vErrors.push(err7);
                            }
                            errors++;
                          }
                        }
                      }
                    }
                    var valid1 = _errs13 === errors;
                  } else {
                    var valid1 = true;
                  }
                  if (valid1) {
                    if (data.sequence !== void 0) {
                      const _errs15 = errors;
                      if (
                        !validate30(data.sequence, {
                          instancePath: instancePath + "/sequence",
                          parentData: data,
                          parentDataProperty: "sequence",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate30.errors
                            : vErrors.concat(validate30.errors);
                        errors = vErrors.length;
                      }
                      var valid1 = _errs15 === errors;
                    } else {
                      var valid1 = true;
                    }
                    if (valid1) {
                      if (data.timestamp_epoch !== void 0) {
                        const _errs16 = errors;
                        if (
                          !validate30(data.timestamp_epoch, {
                            instancePath: instancePath + "/timestamp_epoch",
                            parentData: data,
                            parentDataProperty: "timestamp_epoch",
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate30.errors
                              : vErrors.concat(validate30.errors);
                          errors = vErrors.length;
                        }
                        var valid1 = _errs16 === errors;
                      } else {
                        var valid1 = true;
                      }
                      if (valid1) {
                        if (data.timestamp_quality !== void 0) {
                          const _errs17 = errors;
                          if (
                            !validate135(data.timestamp_quality, {
                              instancePath: instancePath + "/timestamp_quality",
                              parentData: data,
                              parentDataProperty: "timestamp_quality",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate135.errors
                                : vErrors.concat(validate135.errors);
                            errors = vErrors.length;
                          }
                          var valid1 = _errs17 === errors;
                        } else {
                          var valid1 = true;
                        }
                        if (valid1) {
                          if (data.type !== void 0) {
                            let data9 = data.type;
                            const _errs18 = errors;
                            if (typeof data9 !== "string") {
                              const err8 = {
                                instancePath: instancePath + "/type",
                                schemaPath: "#/oneOf/0/properties/type/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err8];
                              } else {
                                vErrors.push(err8);
                              }
                              errors++;
                            }
                            if ("frame_received" !== data9) {
                              const err9 = {
                                instancePath: instancePath + "/type",
                                schemaPath: "#/oneOf/0/properties/type/const",
                                keyword: "const",
                                params: { allowedValue: "frame_received" },
                                message: "must be equal to constant",
                              };
                              if (vErrors === null) {
                                vErrors = [err9];
                              } else {
                                vErrors.push(err9);
                              }
                              errors++;
                            }
                            var valid1 = _errs18 === errors;
                          } else {
                            var valid1 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      const err10 = {
        instancePath,
        schemaPath: "#/oneOf/0/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs20 = errors;
  if (errors === _errs20) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing1;
      if (
        (data.type === void 0 && (missing1 = "type")) ||
        (data.sequence === void 0 && (missing1 = "sequence")) ||
        (data.host_monotonic_ns === void 0 &&
          (missing1 = "host_monotonic_ns")) ||
        (data.timestamp_quality === void 0 &&
          (missing1 = "timestamp_quality")) ||
        (data.timestamp_epoch === void 0 && (missing1 = "timestamp_epoch")) ||
        (data.error_classes === void 0 && (missing1 = "error_classes")) ||
        (data.raw_data_hex === void 0 && (missing1 = "raw_data_hex")) ||
        (data.overflow === void 0 && (missing1 = "overflow"))
      ) {
        const err11 = {
          instancePath,
          schemaPath: "#/oneOf/1/required",
          keyword: "required",
          params: { missingProperty: missing1 },
          message: "must have required property '" + missing1 + "'",
        };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      } else {
        if (data.device_raw_timestamp_us !== void 0) {
          let data10 = data.device_raw_timestamp_us;
          const _errs22 = errors;
          if (
            !(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10)) &&
            data10 !== null
          ) {
            const err12 = {
              instancePath: instancePath + "/device_raw_timestamp_us",
              schemaPath: "#/oneOf/1/properties/device_raw_timestamp_us/type",
              keyword: "type",
              params: {
                type: schema45.oneOf[1].properties.device_raw_timestamp_us.type,
              },
              message: "must be integer,null",
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
          if (errors === _errs22) {
            if (typeof data10 == "number") {
              if (data10 < 0 || isNaN(data10)) {
                const err13 = {
                  instancePath: instancePath + "/device_raw_timestamp_us",
                  schemaPath:
                    "#/oneOf/1/properties/device_raw_timestamp_us/minimum",
                  keyword: "minimum",
                  params: { comparison: ">=", limit: 0 },
                  message: "must be >= 0",
                };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
            }
          }
          var valid3 = _errs22 === errors;
        } else {
          var valid3 = true;
        }
        if (valid3) {
          if (data.device_timestamp_us !== void 0) {
            let data11 = data.device_timestamp_us;
            const _errs24 = errors;
            const _errs25 = errors;
            let valid4 = false;
            const _errs26 = errors;
            if (
              !validate30(data11, {
                instancePath: instancePath + "/device_timestamp_us",
                parentData: data,
                parentDataProperty: "device_timestamp_us",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate30.errors
                  : vErrors.concat(validate30.errors);
              errors = vErrors.length;
            }
            var _valid2 = _errs26 === errors;
            valid4 = valid4 || _valid2;
            if (!valid4) {
              const _errs27 = errors;
              if (data11 !== null) {
                const err14 = {
                  instancePath: instancePath + "/device_timestamp_us",
                  schemaPath:
                    "#/oneOf/1/properties/device_timestamp_us/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
              var _valid2 = _errs27 === errors;
              valid4 = valid4 || _valid2;
            }
            if (!valid4) {
              const err15 = {
                instancePath: instancePath + "/device_timestamp_us",
                schemaPath: "#/oneOf/1/properties/device_timestamp_us/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            } else {
              errors = _errs25;
              if (vErrors !== null) {
                if (_errs25) {
                  vErrors.length = _errs25;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid3 = _errs24 === errors;
          } else {
            var valid3 = true;
          }
          if (valid3) {
            if (data.error_classes !== void 0) {
              let data12 = data.error_classes;
              const _errs29 = errors;
              if (!(
                typeof data12 == "number" &&
                !(data12 % 1) &&
                !isNaN(data12)
              )) {
                const err16 = {
                  instancePath: instancePath + "/error_classes",
                  schemaPath: "#/oneOf/1/properties/error_classes/type",
                  keyword: "type",
                  params: { type: "integer" },
                  message: "must be integer",
                };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
              if (errors === _errs29) {
                if (typeof data12 == "number") {
                  if (data12 < 0 || isNaN(data12)) {
                    const err17 = {
                      instancePath: instancePath + "/error_classes",
                      schemaPath: "#/oneOf/1/properties/error_classes/minimum",
                      keyword: "minimum",
                      params: { comparison: ">=", limit: 0 },
                      message: "must be >= 0",
                    };
                    if (vErrors === null) {
                      vErrors = [err17];
                    } else {
                      vErrors.push(err17);
                    }
                    errors++;
                  }
                }
              }
              var valid3 = _errs29 === errors;
            } else {
              var valid3 = true;
            }
            if (valid3) {
              if (data.host_monotonic_ns !== void 0) {
                const _errs31 = errors;
                if (
                  !validate30(data.host_monotonic_ns, {
                    instancePath: instancePath + "/host_monotonic_ns",
                    parentData: data,
                    parentDataProperty: "host_monotonic_ns",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate30.errors
                      : vErrors.concat(validate30.errors);
                  errors = vErrors.length;
                }
                var valid3 = _errs31 === errors;
              } else {
                var valid3 = true;
              }
              if (valid3) {
                if (data.overflow !== void 0) {
                  const _errs32 = errors;
                  if (typeof data.overflow !== "boolean") {
                    const err18 = {
                      instancePath: instancePath + "/overflow",
                      schemaPath: "#/oneOf/1/properties/overflow/type",
                      keyword: "type",
                      params: { type: "boolean" },
                      message: "must be boolean",
                    };
                    if (vErrors === null) {
                      vErrors = [err18];
                    } else {
                      vErrors.push(err18);
                    }
                    errors++;
                  }
                  var valid3 = _errs32 === errors;
                } else {
                  var valid3 = true;
                }
                if (valid3) {
                  if (data.raw_data_hex !== void 0) {
                    const _errs34 = errors;
                    if (typeof data.raw_data_hex !== "string") {
                      const err19 = {
                        instancePath: instancePath + "/raw_data_hex",
                        schemaPath: "#/oneOf/1/properties/raw_data_hex/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err19];
                      } else {
                        vErrors.push(err19);
                      }
                      errors++;
                    }
                    var valid3 = _errs34 === errors;
                  } else {
                    var valid3 = true;
                  }
                  if (valid3) {
                    if (data.sequence !== void 0) {
                      const _errs36 = errors;
                      if (
                        !validate30(data.sequence, {
                          instancePath: instancePath + "/sequence",
                          parentData: data,
                          parentDataProperty: "sequence",
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate30.errors
                            : vErrors.concat(validate30.errors);
                        errors = vErrors.length;
                      }
                      var valid3 = _errs36 === errors;
                    } else {
                      var valid3 = true;
                    }
                    if (valid3) {
                      if (data.timestamp_epoch !== void 0) {
                        const _errs37 = errors;
                        if (
                          !validate30(data.timestamp_epoch, {
                            instancePath: instancePath + "/timestamp_epoch",
                            parentData: data,
                            parentDataProperty: "timestamp_epoch",
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate30.errors
                              : vErrors.concat(validate30.errors);
                          errors = vErrors.length;
                        }
                        var valid3 = _errs37 === errors;
                      } else {
                        var valid3 = true;
                      }
                      if (valid3) {
                        if (data.timestamp_quality !== void 0) {
                          const _errs38 = errors;
                          if (
                            !validate135(data.timestamp_quality, {
                              instancePath: instancePath + "/timestamp_quality",
                              parentData: data,
                              parentDataProperty: "timestamp_quality",
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate135.errors
                                : vErrors.concat(validate135.errors);
                            errors = vErrors.length;
                          }
                          var valid3 = _errs38 === errors;
                        } else {
                          var valid3 = true;
                        }
                        if (valid3) {
                          if (data.type !== void 0) {
                            let data19 = data.type;
                            const _errs39 = errors;
                            if (typeof data19 !== "string") {
                              const err20 = {
                                instancePath: instancePath + "/type",
                                schemaPath: "#/oneOf/1/properties/type/type",
                                keyword: "type",
                                params: { type: "string" },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err20];
                              } else {
                                vErrors.push(err20);
                              }
                              errors++;
                            }
                            if ("bus_diagnostic" !== data19) {
                              const err21 = {
                                instancePath: instancePath + "/type",
                                schemaPath: "#/oneOf/1/properties/type/const",
                                keyword: "const",
                                params: { allowedValue: "bus_diagnostic" },
                                message: "must be equal to constant",
                              };
                              if (vErrors === null) {
                                vErrors = [err21];
                              } else {
                                vErrors.push(err21);
                              }
                              errors++;
                            }
                            var valid3 = _errs39 === errors;
                          } else {
                            var valid3 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      const err22 = {
        instancePath,
        schemaPath: "#/oneOf/1/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err22];
      } else {
        vErrors.push(err22);
      }
      errors++;
    }
  }
  var _valid0 = _errs20 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
  }
  if (!valid0) {
    const err23 = {
      instancePath,
      schemaPath: "#/oneOf",
      keyword: "oneOf",
      params: { passingSchemas: passing0 },
      message: "must match exactly one schema in oneOf",
    };
    if (vErrors === null) {
      vErrors = [err23];
    } else {
      vErrors.push(err23);
    }
    errors++;
    validate125.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate125.errors = vErrors;
  return errors === 0;
}
var schema49 = { type: "string", enum: ["subscriber_lag"] };
function validate143(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate143.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(data === "subscriber_lag")) {
    validate143.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema49.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate143.errors = vErrors;
  return errors === 0;
}
function validate227(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (errors === _errs1) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.type === void 0 && (missing0 = "type")) ||
        (data.api_version === void 0 && (missing0 = "api_version")) ||
        (data.server_instance_id === void 0 &&
          (missing0 = "server_instance_id")) ||
        (data.session_epoch === void 0 && (missing0 = "session_epoch")) ||
        (data.capacity === void 0 && (missing0 = "capacity"))
      ) {
        const err0 = {
          instancePath,
          schemaPath: "#/oneOf/0/required",
          keyword: "required",
          params: { missingProperty: missing0 },
          message: "must have required property '" + missing0 + "'",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      } else {
        if (data.api_version !== void 0) {
          const _errs3 = errors;
          if (typeof data.api_version !== "string") {
            const err1 = {
              instancePath: instancePath + "/api_version",
              schemaPath: "#/oneOf/0/properties/api_version/type",
              keyword: "type",
              params: { type: "string" },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          var valid1 = _errs3 === errors;
        } else {
          var valid1 = true;
        }
        if (valid1) {
          if (data.capacity !== void 0) {
            let data1 = data.capacity;
            const _errs5 = errors;
            if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1))) {
              const err2 = {
                instancePath: instancePath + "/capacity",
                schemaPath: "#/oneOf/0/properties/capacity/type",
                keyword: "type",
                params: { type: "integer" },
                message: "must be integer",
              };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if (errors === _errs5) {
              if (typeof data1 == "number") {
                if (data1 < 0 || isNaN(data1)) {
                  const err3 = {
                    instancePath: instancePath + "/capacity",
                    schemaPath: "#/oneOf/0/properties/capacity/minimum",
                    keyword: "minimum",
                    params: { comparison: ">=", limit: 0 },
                    message: "must be >= 0",
                  };
                  if (vErrors === null) {
                    vErrors = [err3];
                  } else {
                    vErrors.push(err3);
                  }
                  errors++;
                }
              }
            }
            var valid1 = _errs5 === errors;
          } else {
            var valid1 = true;
          }
          if (valid1) {
            if (data.server_instance_id !== void 0) {
              const _errs7 = errors;
              if (typeof data.server_instance_id !== "string") {
                const err4 = {
                  instancePath: instancePath + "/server_instance_id",
                  schemaPath: "#/oneOf/0/properties/server_instance_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
              var valid1 = _errs7 === errors;
            } else {
              var valid1 = true;
            }
            if (valid1) {
              if (data.session_epoch !== void 0) {
                const _errs9 = errors;
                if (typeof data.session_epoch !== "string") {
                  const err5 = {
                    instancePath: instancePath + "/session_epoch",
                    schemaPath: "#/oneOf/0/properties/session_epoch/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err5];
                  } else {
                    vErrors.push(err5);
                  }
                  errors++;
                }
                var valid1 = _errs9 === errors;
              } else {
                var valid1 = true;
              }
              if (valid1) {
                if (data.type !== void 0) {
                  let data4 = data.type;
                  const _errs11 = errors;
                  if (typeof data4 !== "string") {
                    const err6 = {
                      instancePath: instancePath + "/type",
                      schemaPath: "#/oneOf/0/properties/type/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err6];
                    } else {
                      vErrors.push(err6);
                    }
                    errors++;
                  }
                  if ("hello" !== data4) {
                    const err7 = {
                      instancePath: instancePath + "/type",
                      schemaPath: "#/oneOf/0/properties/type/const",
                      keyword: "const",
                      params: { allowedValue: "hello" },
                      message: "must be equal to constant",
                    };
                    if (vErrors === null) {
                      vErrors = [err7];
                    } else {
                      vErrors.push(err7);
                    }
                    errors++;
                  }
                  var valid1 = _errs11 === errors;
                } else {
                  var valid1 = true;
                }
              }
            }
          }
        }
      }
    } else {
      const err8 = {
        instancePath,
        schemaPath: "#/oneOf/0/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs13 = errors;
  if (errors === _errs13) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing1;
      if (
        (data.type === void 0 && (missing1 = "type")) ||
        (data.server_instance_id === void 0 &&
          (missing1 = "server_instance_id")) ||
        (data.session_epoch === void 0 && (missing1 = "session_epoch")) ||
        (data.events === void 0 && (missing1 = "events"))
      ) {
        const err9 = {
          instancePath,
          schemaPath: "#/oneOf/1/required",
          keyword: "required",
          params: { missingProperty: missing1 },
          message: "must have required property '" + missing1 + "'",
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      } else {
        if (data.events !== void 0) {
          let data5 = data.events;
          const _errs15 = errors;
          if (errors === _errs15) {
            if (Array.isArray(data5)) {
              var valid3 = true;
              const len0 = data5.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs17 = errors;
                if (
                  !validate125(data5[i0], {
                    instancePath: instancePath + "/events/" + i0,
                    parentData: data5,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate125.errors
                      : vErrors.concat(validate125.errors);
                  errors = vErrors.length;
                }
                var valid3 = _errs17 === errors;
                if (!valid3) {
                  break;
                }
              }
            } else {
              const err10 = {
                instancePath: instancePath + "/events",
                schemaPath: "#/oneOf/1/properties/events/type",
                keyword: "type",
                params: { type: "array" },
                message: "must be array",
              };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          }
          var valid2 = _errs15 === errors;
        } else {
          var valid2 = true;
        }
        if (valid2) {
          if (data.server_instance_id !== void 0) {
            const _errs18 = errors;
            if (typeof data.server_instance_id !== "string") {
              const err11 = {
                instancePath: instancePath + "/server_instance_id",
                schemaPath: "#/oneOf/1/properties/server_instance_id/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            var valid2 = _errs18 === errors;
          } else {
            var valid2 = true;
          }
          if (valid2) {
            if (data.session_epoch !== void 0) {
              const _errs20 = errors;
              if (typeof data.session_epoch !== "string") {
                const err12 = {
                  instancePath: instancePath + "/session_epoch",
                  schemaPath: "#/oneOf/1/properties/session_epoch/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
              var valid2 = _errs20 === errors;
            } else {
              var valid2 = true;
            }
            if (valid2) {
              if (data.type !== void 0) {
                let data9 = data.type;
                const _errs22 = errors;
                if (typeof data9 !== "string") {
                  const err13 = {
                    instancePath: instancePath + "/type",
                    schemaPath: "#/oneOf/1/properties/type/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                if ("events" !== data9) {
                  const err14 = {
                    instancePath: instancePath + "/type",
                    schemaPath: "#/oneOf/1/properties/type/const",
                    keyword: "const",
                    params: { allowedValue: "events" },
                    message: "must be equal to constant",
                  };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                var valid2 = _errs22 === errors;
              } else {
                var valid2 = true;
              }
            }
          }
        }
      }
    } else {
      const err15 = {
        instancePath,
        schemaPath: "#/oneOf/1/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err15];
      } else {
        vErrors.push(err15);
      }
      errors++;
    }
  }
  var _valid0 = _errs13 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs24 = errors;
    if (errors === _errs24) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing2;
        if (
          (data.type === void 0 && (missing2 = "type")) ||
          (data.cause === void 0 && (missing2 = "cause")) ||
          (data.count === void 0 && (missing2 = "count"))
        ) {
          const err16 = {
            instancePath,
            schemaPath: "#/oneOf/2/required",
            keyword: "required",
            params: { missingProperty: missing2 },
            message: "must have required property '" + missing2 + "'",
          };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        } else {
          if (data.cause !== void 0) {
            const _errs26 = errors;
            if (
              !validate143(data.cause, {
                instancePath: instancePath + "/cause",
                parentData: data,
                parentDataProperty: "cause",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate143.errors
                  : vErrors.concat(validate143.errors);
              errors = vErrors.length;
            }
            var valid4 = _errs26 === errors;
          } else {
            var valid4 = true;
          }
          if (valid4) {
            if (data.count !== void 0) {
              const _errs27 = errors;
              if (
                !validate30(data.count, {
                  instancePath: instancePath + "/count",
                  parentData: data,
                  parentDataProperty: "count",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid4 = _errs27 === errors;
            } else {
              var valid4 = true;
            }
            if (valid4) {
              if (data.type !== void 0) {
                let data12 = data.type;
                const _errs28 = errors;
                if (typeof data12 !== "string") {
                  const err17 = {
                    instancePath: instancePath + "/type",
                    schemaPath: "#/oneOf/2/properties/type/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if ("gap" !== data12) {
                  const err18 = {
                    instancePath: instancePath + "/type",
                    schemaPath: "#/oneOf/2/properties/type/const",
                    keyword: "const",
                    params: { allowedValue: "gap" },
                    message: "must be equal to constant",
                  };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
                var valid4 = _errs28 === errors;
              } else {
                var valid4 = true;
              }
            }
          }
        }
      } else {
        const err19 = {
          instancePath,
          schemaPath: "#/oneOf/2/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    var _valid0 = _errs24 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs30 = errors;
      if (errors === _errs30) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing3;
          if (data.type === void 0 && (missing3 = "type")) {
            const err20 = {
              instancePath,
              schemaPath: "#/oneOf/3/required",
              keyword: "required",
              params: { missingProperty: missing3 },
              message: "must have required property '" + missing3 + "'",
            };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          } else {
            if (data.type !== void 0) {
              let data13 = data.type;
              if (typeof data13 !== "string") {
                const err21 = {
                  instancePath: instancePath + "/type",
                  schemaPath: "#/oneOf/3/properties/type/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              if ("resume_unavailable" !== data13) {
                const err22 = {
                  instancePath: instancePath + "/type",
                  schemaPath: "#/oneOf/3/properties/type/const",
                  keyword: "const",
                  params: { allowedValue: "resume_unavailable" },
                  message: "must be equal to constant",
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
          }
        } else {
          const err23 = {
            instancePath,
            schemaPath: "#/oneOf/3/type",
            keyword: "type",
            params: { type: "object" },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
      }
      var _valid0 = _errs30 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs34 = errors;
        if (errors === _errs34) {
          if (data && typeof data == "object" && !Array.isArray(data)) {
            let missing4;
            if (
              (data.type === void 0 && (missing4 = "type")) ||
              (data.state === void 0 && (missing4 = "state")) ||
              (data.code === void 0 && (missing4 = "code"))
            ) {
              const err24 = {
                instancePath,
                schemaPath: "#/oneOf/4/required",
                keyword: "required",
                params: { missingProperty: missing4 },
                message: "must have required property '" + missing4 + "'",
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            } else {
              if (data.code !== void 0) {
                const _errs36 = errors;
                if (
                  !validate59(data.code, {
                    instancePath: instancePath + "/code",
                    parentData: data,
                    parentDataProperty: "code",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate59.errors
                      : vErrors.concat(validate59.errors);
                  errors = vErrors.length;
                }
                var valid6 = _errs36 === errors;
              } else {
                var valid6 = true;
              }
              if (valid6) {
                if (data.state !== void 0) {
                  const _errs37 = errors;
                  if (
                    !validate61(data.state, {
                      instancePath: instancePath + "/state",
                      parentData: data,
                      parentDataProperty: "state",
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate61.errors
                        : vErrors.concat(validate61.errors);
                    errors = vErrors.length;
                  }
                  var valid6 = _errs37 === errors;
                } else {
                  var valid6 = true;
                }
                if (valid6) {
                  if (data.type !== void 0) {
                    let data16 = data.type;
                    const _errs38 = errors;
                    if (typeof data16 !== "string") {
                      const err25 = {
                        instancePath: instancePath + "/type",
                        schemaPath: "#/oneOf/4/properties/type/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err25];
                      } else {
                        vErrors.push(err25);
                      }
                      errors++;
                    }
                    if ("session_fault" !== data16) {
                      const err26 = {
                        instancePath: instancePath + "/type",
                        schemaPath: "#/oneOf/4/properties/type/const",
                        keyword: "const",
                        params: { allowedValue: "session_fault" },
                        message: "must be equal to constant",
                      };
                      if (vErrors === null) {
                        vErrors = [err26];
                      } else {
                        vErrors.push(err26);
                      }
                      errors++;
                    }
                    var valid6 = _errs38 === errors;
                  } else {
                    var valid6 = true;
                  }
                }
              }
            }
          } else {
            const err27 = {
              instancePath,
              schemaPath: "#/oneOf/4/type",
              keyword: "type",
              params: { type: "object" },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
        var _valid0 = _errs34 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
          }
        }
      }
    }
  }
  if (!valid0) {
    const err28 = {
      instancePath,
      schemaPath: "#/oneOf",
      keyword: "oneOf",
      params: { passingSchemas: passing0 },
      message: "must match exactly one schema in oneOf",
    };
    if (vErrors === null) {
      vErrors = [err28];
    } else {
      vErrors.push(err28);
    }
    errors++;
    validate227.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate227.errors = vErrors;
  return errors === 0;
}
var subscribe = validate233;
var schema50 = {
  type: "object",
  properties: {
    after_sequence: {
      anyOf: [{ $ref: "#/definitions/Decimal" }, { type: "null" }],
      default: null,
    },
    csrf_token: { type: ["string", "null"], default: null },
    filter: {
      allOf: [{ $ref: "#/definitions/Filter" }],
      default: { direction: null, extended: null, ids: [] },
    },
    protocol_version: { type: "string" },
    type: { $ref: "#/definitions/SubscribeKind" },
  },
  additionalProperties: false,
  required: ["type", "protocol_version"],
};
var schema51 = {
  type: "object",
  properties: {
    direction: {
      anyOf: [{ $ref: "#/definitions/Direction" }, { type: "null" }],
      default: null,
    },
    extended: { type: ["boolean", "null"], default: null },
    ids: {
      type: "array",
      default: [],
      items: { type: "integer", format: "uint32", minimum: 0 },
      maxItems: 256,
    },
  },
  additionalProperties: false,
};
function validate151(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (!(key0 === "direction" || key0 === "extended" || key0 === "ids")) {
          validate151.errors = [
            {
              instancePath,
              schemaPath: "#/additionalProperties",
              keyword: "additionalProperties",
              params: { additionalProperty: key0 },
              message: "must NOT have additional properties",
            },
          ];
          return false;
          break;
        }
      }
      if (_errs1 === errors) {
        if (data.direction !== void 0) {
          let data0 = data.direction;
          const _errs2 = errors;
          const _errs3 = errors;
          let valid1 = false;
          const _errs4 = errors;
          if (
            !validate127(data0, {
              instancePath: instancePath + "/direction",
              parentData: data,
              parentDataProperty: "direction",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate127.errors
                : vErrors.concat(validate127.errors);
            errors = vErrors.length;
          }
          var _valid0 = _errs4 === errors;
          valid1 = valid1 || _valid0;
          if (!valid1) {
            const _errs5 = errors;
            if (data0 !== null) {
              const err0 = {
                instancePath: instancePath + "/direction",
                schemaPath: "#/properties/direction/anyOf/1/type",
                keyword: "type",
                params: { type: "null" },
                message: "must be null",
              };
              if (vErrors === null) {
                vErrors = [err0];
              } else {
                vErrors.push(err0);
              }
              errors++;
            }
            var _valid0 = _errs5 === errors;
            valid1 = valid1 || _valid0;
          }
          if (!valid1) {
            const err1 = {
              instancePath: instancePath + "/direction",
              schemaPath: "#/properties/direction/anyOf",
              keyword: "anyOf",
              params: {},
              message: "must match a schema in anyOf",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
            validate151.errors = vErrors;
            return false;
          } else {
            errors = _errs3;
            if (vErrors !== null) {
              if (_errs3) {
                vErrors.length = _errs3;
              } else {
                vErrors = null;
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.extended !== void 0) {
            let data1 = data.extended;
            const _errs7 = errors;
            if (typeof data1 !== "boolean" && data1 !== null) {
              validate151.errors = [
                {
                  instancePath: instancePath + "/extended",
                  schemaPath: "#/properties/extended/type",
                  keyword: "type",
                  params: { type: schema51.properties.extended.type },
                  message: "must be boolean,null",
                },
              ];
              return false;
            }
            var valid0 = _errs7 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.ids !== void 0) {
              let data2 = data.ids;
              const _errs9 = errors;
              if (errors === _errs9) {
                if (Array.isArray(data2)) {
                  if (data2.length > 256) {
                    validate151.errors = [
                      {
                        instancePath: instancePath + "/ids",
                        schemaPath: "#/properties/ids/maxItems",
                        keyword: "maxItems",
                        params: { limit: 256 },
                        message: "must NOT have more than 256 items",
                      },
                    ];
                    return false;
                  } else {
                    var valid2 = true;
                    const len0 = data2.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      let data3 = data2[i0];
                      const _errs11 = errors;
                      if (!(
                        typeof data3 == "number" &&
                        !(data3 % 1) &&
                        !isNaN(data3)
                      )) {
                        validate151.errors = [
                          {
                            instancePath: instancePath + "/ids/" + i0,
                            schemaPath: "#/properties/ids/items/type",
                            keyword: "type",
                            params: { type: "integer" },
                            message: "must be integer",
                          },
                        ];
                        return false;
                      }
                      if (errors === _errs11) {
                        if (typeof data3 == "number") {
                          if (data3 < 0 || isNaN(data3)) {
                            validate151.errors = [
                              {
                                instancePath: instancePath + "/ids/" + i0,
                                schemaPath: "#/properties/ids/items/minimum",
                                keyword: "minimum",
                                params: { comparison: ">=", limit: 0 },
                                message: "must be >= 0",
                              },
                            ];
                            return false;
                          }
                        }
                      }
                      var valid2 = _errs11 === errors;
                      if (!valid2) {
                        break;
                      }
                    }
                  }
                } else {
                  validate151.errors = [
                    {
                      instancePath: instancePath + "/ids",
                      schemaPath: "#/properties/ids/type",
                      keyword: "type",
                      params: { type: "array" },
                      message: "must be array",
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs9 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate151.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate151.errors = vErrors;
  return errors === 0;
}
var schema52 = { type: "string", enum: ["subscribe"] };
function validate154(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate154.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(data === "subscribe")) {
    validate154.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema52.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate154.errors = vErrors;
  return errors === 0;
}
function validate233(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.type === void 0 && (missing0 = "type")) ||
        (data.protocol_version === void 0 && (missing0 = "protocol_version"))
      ) {
        validate233.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(
            key0 === "after_sequence" ||
            key0 === "csrf_token" ||
            key0 === "filter" ||
            key0 === "protocol_version" ||
            key0 === "type"
          )) {
            validate233.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.after_sequence !== void 0) {
            let data0 = data.after_sequence;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (
              !validate30(data0, {
                instancePath: instancePath + "/after_sequence",
                parentData: data,
                parentDataProperty: "after_sequence",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate30.errors
                  : vErrors.concat(validate30.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const _errs5 = errors;
              if (data0 !== null) {
                const err0 = {
                  instancePath: instancePath + "/after_sequence",
                  schemaPath: "#/properties/after_sequence/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
            }
            if (!valid1) {
              const err1 = {
                instancePath: instancePath + "/after_sequence",
                schemaPath: "#/properties/after_sequence/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate233.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.csrf_token !== void 0) {
              let data1 = data.csrf_token;
              const _errs7 = errors;
              if (typeof data1 !== "string" && data1 !== null) {
                validate233.errors = [
                  {
                    instancePath: instancePath + "/csrf_token",
                    schemaPath: "#/properties/csrf_token/type",
                    keyword: "type",
                    params: { type: schema50.properties.csrf_token.type },
                    message: "must be string,null",
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.filter !== void 0) {
                const _errs9 = errors;
                if (
                  !validate151(data.filter, {
                    instancePath: instancePath + "/filter",
                    parentData: data,
                    parentDataProperty: "filter",
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate151.errors
                      : vErrors.concat(validate151.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.protocol_version !== void 0) {
                  const _errs11 = errors;
                  if (typeof data.protocol_version !== "string") {
                    validate233.errors = [
                      {
                        instancePath: instancePath + "/protocol_version",
                        schemaPath: "#/properties/protocol_version/type",
                        keyword: "type",
                        params: { type: "string" },
                        message: "must be string",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.type !== void 0) {
                    const _errs13 = errors;
                    if (
                      !validate154(data.type, {
                        instancePath: instancePath + "/type",
                        parentData: data,
                        parentDataProperty: "type",
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate154.errors
                          : vErrors.concat(validate154.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs13 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate233.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate233.errors = vErrors;
  return errors === 0;
}
var tx = validate237;
function validate237(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.client_request_id === void 0 &&
          (missing0 = "client_request_id")) ||
        (data.frame === void 0 && (missing0 = "frame"))
      ) {
        validate237.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "client_request_id" || key0 === "frame")) {
            validate237.errors = [
              {
                instancePath,
                schemaPath: "#/additionalProperties",
                keyword: "additionalProperties",
                params: { additionalProperty: key0 },
                message: "must NOT have additional properties",
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.client_request_id !== void 0) {
            let data0 = data.client_request_id;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func2(data0) > 128) {
                  validate237.errors = [
                    {
                      instancePath: instancePath + "/client_request_id",
                      schemaPath: "#/properties/client_request_id/maxLength",
                      keyword: "maxLength",
                      params: { limit: 128 },
                      message: "must NOT have more than 128 characters",
                    },
                  ];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate237.errors = [
                      {
                        instancePath: instancePath + "/client_request_id",
                        schemaPath: "#/properties/client_request_id/minLength",
                        keyword: "minLength",
                        params: { limit: 1 },
                        message: "must NOT have fewer than 1 characters",
                      },
                    ];
                    return false;
                  }
                }
              } else {
                validate237.errors = [
                  {
                    instancePath: instancePath + "/client_request_id",
                    schemaPath: "#/properties/client_request_id/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.frame !== void 0) {
              const _errs4 = errors;
              if (
                !validate81(data.frame, {
                  instancePath: instancePath + "/frame",
                  parentData: data,
                  parentDataProperty: "frame",
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate81.errors
                    : vErrors.concat(validate81.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate237.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate237.errors = vErrors;
  return errors === 0;
}
var tx_receipt = validate239;
var schema55 = {
  type: "string",
  enum: ["none", "virtual_bus_accepted", "backend_submitted"],
};
function validate161(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate161.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "none" ||
    data === "virtual_bus_accepted" ||
    data === "backend_submitted"
  )) {
    validate161.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema55.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate161.errors = vErrors;
  return errors === 0;
}
var schema56 = {
  type: "string",
  enum: ["queued", "submitted", "failed", "outcome_unknown"],
};
function validate164(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    validate164.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "string" },
        message: "must be string",
      },
    ];
    return false;
  }
  if (!(
    data === "queued" ||
    data === "submitted" ||
    data === "failed" ||
    data === "outcome_unknown"
  )) {
    validate164.errors = [
      {
        instancePath,
        schemaPath: "#/enum",
        keyword: "enum",
        params: { allowedValues: schema56.enum },
        message: "must be equal to one of the allowed values",
      },
    ];
    return false;
  }
  validate164.errors = vErrors;
  return errors === 0;
}
function validate239(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.receipt === void 0 && (missing0 = "receipt")) ||
        (data.state === void 0 && (missing0 = "state")) ||
        (data.simulated === void 0 && (missing0 = "simulated")) ||
        (data.confirmation === void 0 && (missing0 = "confirmation"))
      ) {
        validate239.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.confirmation !== void 0) {
          const _errs1 = errors;
          if (
            !validate161(data.confirmation, {
              instancePath: instancePath + "/confirmation",
              parentData: data,
              parentDataProperty: "confirmation",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate161.errors
                : vErrors.concat(validate161.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.error !== void 0) {
            let data1 = data.error;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (
              !validate78(data1, {
                instancePath: instancePath + "/error",
                parentData: data,
                parentDataProperty: "error",
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate78.errors
                  : vErrors.concat(validate78.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const _errs5 = errors;
              if (data1 !== null) {
                const err0 = {
                  instancePath: instancePath + "/error",
                  schemaPath: "#/properties/error/anyOf/1/type",
                  keyword: "type",
                  params: { type: "null" },
                  message: "must be null",
                };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs5 === errors;
              valid1 = valid1 || _valid0;
            }
            if (!valid1) {
              const err1 = {
                instancePath: instancePath + "/error",
                schemaPath: "#/properties/error/anyOf",
                keyword: "anyOf",
                params: {},
                message: "must match a schema in anyOf",
              };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate239.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.receipt !== void 0) {
              const _errs7 = errors;
              if (typeof data.receipt !== "string") {
                validate239.errors = [
                  {
                    instancePath: instancePath + "/receipt",
                    schemaPath: "#/properties/receipt/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.session_id !== void 0) {
                const _errs9 = errors;
                if (typeof data.session_id !== "string") {
                  validate239.errors = [
                    {
                      instancePath: instancePath + "/session_id",
                      schemaPath: "#/properties/session_id/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.simulated !== void 0) {
                  const _errs11 = errors;
                  if (typeof data.simulated !== "boolean") {
                    validate239.errors = [
                      {
                        instancePath: instancePath + "/simulated",
                        schemaPath: "#/properties/simulated/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.state !== void 0) {
                    const _errs13 = errors;
                    if (
                      !validate164(data.state, {
                        instancePath: instancePath + "/state",
                        parentData: data,
                        parentDataProperty: "state",
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate164.errors
                          : vErrors.concat(validate164.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs13 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate239.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate239.errors = vErrors;
  return errors === 0;
}
var version = validate243;
function validate243(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (
        (data.version === void 0 && (missing0 = "version")) ||
        (data.api_version === void 0 && (missing0 = "api_version")) ||
        (data.server_instance_id === void 0 &&
          (missing0 = "server_instance_id")) ||
        (data.stage === void 0 && (missing0 = "stage")) ||
        (data.web_ui === void 0 && (missing0 = "web_ui"))
      ) {
        validate243.errors = [
          {
            instancePath,
            schemaPath: "#/required",
            keyword: "required",
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.api_version !== void 0) {
          const _errs1 = errors;
          if (typeof data.api_version !== "string") {
            validate243.errors = [
              {
                instancePath: instancePath + "/api_version",
                schemaPath: "#/properties/api_version/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.server_instance_id !== void 0) {
            const _errs3 = errors;
            if (typeof data.server_instance_id !== "string") {
              validate243.errors = [
                {
                  instancePath: instancePath + "/server_instance_id",
                  schemaPath: "#/properties/server_instance_id/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.stage !== void 0) {
              const _errs5 = errors;
              if (typeof data.stage !== "string") {
                validate243.errors = [
                  {
                    instancePath: instancePath + "/stage",
                    schemaPath: "#/properties/stage/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.version !== void 0) {
                const _errs7 = errors;
                if (typeof data.version !== "string") {
                  validate243.errors = [
                    {
                      instancePath: instancePath + "/version",
                      schemaPath: "#/properties/version/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.web_ui !== void 0) {
                  const _errs9 = errors;
                  if (typeof data.web_ui !== "boolean") {
                    validate243.errors = [
                      {
                        instancePath: instancePath + "/web_ui",
                        schemaPath: "#/properties/web_ui/type",
                        keyword: "type",
                        params: { type: "boolean" },
                        message: "must be boolean",
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate243.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate243.errors = vErrors;
  return errors === 0;
}
export {
  auth,
  capabilities,
  capture,
  capture_request,
  captures,
  config,
  counter,
  create_request,
  device_report,
  devices,
  diagnostics,
  error,
  frame_input,
  legal,
  pair_link,
  pair_request,
  periodic_request,
  periodic_task,
  periodic_tasks,
  receipt_lookup,
  session,
  sessions,
  stream_message,
  subscribe,
  tx,
  tx_receipt,
  version,
};
