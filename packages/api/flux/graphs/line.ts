// const vega = require('vega')
import vega from 'vega'

// : {values: {x: number, y: number, c: number}[], name: string}[]
export const genSchema = (...data) => ({
    "$schema": "https://vega.github.io/schema/vega/v4.json",
    "width": 3200,
    "height": 1800,
    "padding": 5,

    signals: [],
    // "signals": [
    //   {
    //     "name": "interpolate",
    //     "value": "linear",
    //     "bind": {
    //       "input": "select",
    //       "options": [
    //         "basis",
    //         "cardinal",
    //         "catmull-rom",
    //         "linear",
    //         "monotone",
    //         "natural",
    //         "step",
    //         "step-after",
    //         "step-before"
    //       ]
    //     }
    //   }
    // ],

    // interpolate: "monotone",

    data,

    "scales": [
    //   {
    //     "name": "x",
    //     "type": "point",
    //     "range": "width",
    //     "domain": {"data": "table", "field": "x"}
    //   },
    //   {
    //     "name": "y",
    //     "type": "linear",
    //     "range": "height",
    //     "nice": true,
    //     "zero": true,
    //     "domain": {"data": "table", "field": "y"}
    //   },
    //   {
    //     "name": "color",
    //     "type": "ordinal",
    //     "range": {scheme: 'catagory20'},
    //     "domain": {"data": "table", "field": "c"}
    //   }
    ],

    "axes": [
      {"orient": "bottom", "scale": "x"},
      {"orient": "left", "scale": "y"}
    ],

    "marks": [
      {
        "type": "group",
        "from": {
          "facet": {
            "name": "series",
            "data": "table",
            "groupby": "c"
          }
        },
        "marks": [
          {
            "type": "line",
            "from": {"data": "series"},
            "encode": {
              "enter": {
                "x": {"scale": "x", "field": "x"},
                "y": {"scale": "y", "field": "y"},
                "stroke": {"scale": "color", "field": "c"},
                "strokeWidth": {"value": 2}
              },
              "update": {
                "interpolate": {"signal": "interpolate"},
                "fillOpacity": {"value": 1}
              },
              "hover": {
                "fillOpacity": {"value": 0.5}
              }
            }
          }
        ]
      }
    ]
  })

export const toSvg = async (data) => {
    return (new vega.View(vega.parse(genSchema(data))).renderer('none').initialize()).toSVG()
}