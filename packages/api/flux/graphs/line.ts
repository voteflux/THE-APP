
const vega = require('vega')
const vl = require('vega-lite')

// : {values: {x: number, y: number, c: number}[], name: string}[]
export const genSchema = (data, fields: {x: string, y: string}, title) => {
  console.log(data.name)
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
    // "description": "Google's stock price over time.",
    "data": data,
    "mark": "line",
    "encoding": {
      "x": {"field": fields.x, "type": "temporal", axis: { format: "%d-%m-%y" }},
      "y": {"field": fields.y, "type": "quantitative"},
    },
    width: 711,
    height: 400,
    title
  }
}

export const toSvg = async (data, fields, title) => {
  const spec = genSchema(data, fields, title)
  const parsed = vega.parse(vl.compile(spec).spec)
  const view = new vega.View(parsed).renderer('none').initialize()
  return view.toSVG()
}
