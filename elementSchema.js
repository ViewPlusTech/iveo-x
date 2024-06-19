/**
 * elementSchema module.
 * @module @fizz/elementSchema
 */

/**
 * Schemata for element attributes, properties, and labels.
 */
 export class elementSchema {
  /**
   * Constructor
   * @constructor
   */
  constructor() {
    this.elementSchema = null;
    // class members
    this.init();
  }

  /**
   * Initializes class.
   */
  async init() {
    this.elementSchema = {
      shapes: {
        rect: { 
          tagname: 'rect',
          name: 'rectangle',
          desc: 'rectangle',
          attributes: {
            x: {
              label: 'start-left',
              desc: 'start-left',
              default: 0,
              type: Number,
            },
            y: {
              label: 'start-top',
              desc: 'start-top',
              default: 0,
              type: Number,
            },
            width: {
              label: 'width',
              desc: 'horizontal extent',
              default: 100,
              type: Number,
            },
            height: {
              label: 'height',
              desc: 'vertical extent',
              default: 50,
              type: Number,
            },
          },
          properties: {
            'fill': {
              default: 'cornflowerblue',
              type: 'color'
            },
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
        circle: {
          tagname: 'circle',
          name: 'circle',
          desc: 'circle',
          attributes: {
            cx: {
              label: 'center-x',
              desc: 'center-x',
              default: 150,
              type: Number,
            },
            cy: {
              label: 'center-y',
              desc: 'center-y',
              default: 25,
              type: Number,
            },
            r: {
              label: 'radius',
              desc: 'distance from the center to the edge',
              default: 20,
              type: Number,
            },
          },
          properties: {
            'fill': {
              default: 'cornflowerblue',
              type: 'color'
            },
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
        ellipse: {
          tagname: 'ellipse',
          name: 'ellipse',
          desc: 'ellipse',
          attributes: {
            cx: {
              label: 'center-x',
              desc: 'center-x',
              default: 300,
              type: Number,
            },
            cy: {
              label: 'center-y',
              desc: 'center-y',
              default: 25,
              type: Number,
            },
            rx: {
              label: 'radius',
              desc: 'horizontal distance from the center to the edge',
              default: 30,
              type: Number,
            },
            ry: {
              label: 'radius',
              desc: 'vertical distance from the center to the edge',
              default: 20,
              type: Number,
            },
          },
          properties: {
            'fill': {
              default: 'cornflowerblue',
              type: 'color'
            },
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
        line: { 
          tagname: 'line',
          name: 'line',
          desc: 'line',
          attributes: {
            x1: {
              label: 'start-x',
              desc: 'horizontal start',
              default: 10,
              type: Number,
            },
            y1: {
              label: 'start-y',
              desc: 'vertical start',
              default: 100,
              type: Number,
            },
            x2: {
              label: 'end-x',
              desc: 'horizontal end',
              default: 100,
              type: Number,
            },
            y2: {
              label: 'end-y',
              desc: 'vertical end',
              default: 150,
              type: Number,
            },
          },
          properties: {
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 3,
              type: Number,
            },
            'stroke-linecap': {
              default: 'round',
              type: String,
            },
          },
        },
        polyline: { 
          tagname: 'polyline',
          name: 'polyline',
          desc: 'multi-segment line',
          attributes: { 
            points: {
              label: 'set of points',
              desc: 'set of coordinate points separated by commas or spaces',
              default: '150,150 200,200 150,200 200,150',
              type: 'coordinatePair',
            },
          },
          properties: {
            'fill': {
              default: 'none',
              type: 'color'
            },
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 2,
              type: Number,
            },
          },
        },
        polygon: { 
          tagname: 'polygon',
          name: 'polygon',
          desc: 'multi-sided shape',
          attributes: { 
            points: {
              label: 'set of points',
              desc: 'set of coordinate points separated by commas or spaces',
              default: '350,200 373,240 327,240',
              type: 'coordinatePair',
            },
          },
          properties: {
            'fill': {
              default: 'cornflowerblue',
              type: 'color'
            },
            'stroke': {
              default: 'blue',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
        path: { 
          tagname: 'path',
          name: 'path',
          desc: 'multi-segmented shape',
          attributes: { 
            d: {
              label: 'set of commands and points',
              desc: 'set of segment commands and coordinate points separated by commas or spaces',
              default: 'M117.5,220.3 135,250 117.5,280.3 83.5,280.3 65,250 83.5,220.3 117.5,220.3 Z',
              type: 'pathCommand,coordinateSet',
            },
          },
          properties: {
            'fill': {
              default: 'lavender',
              type: 'color'
            },
            'stroke': {
              default: 'purple',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
        text: { 
          tagname: 'text',
          name: 'text',
          desc: 'text',
          attributes: {
            x: {
              label: 'horizontal start',
              desc: 'horizontal start',
              default: 100,
              type: Number,
            },
            y: {
              label: 'baseline',
              desc: 'baseline',
              default: 100,
              type: Number,
            },
            textContent: {
              label: 'text',
              desc: 'textual value',
              default: 'Text value',
              type: String,
            },
          },
          properties: {
            'fill': {
              default: 'black',
              type: 'color'
            },
            'stroke': {
              default: 'none',
              type: 'color'
            },
            'stroke-width': {
              default: 0,
              type: Number,
            },
            'font-size': {
              default: '15px',
              type: 'UnitNumber',
            },
            'text-anchor': {
              default: 'start',
              options: [
                'start',
                'middle',
                'end',
              ],
              type: String,
            },
          },
        },
        // Custom shapes
        triangle: { 
          tagname: 'polygon',
          name: 'triangle',
          desc: 'three-sided shape',
          attributes: { 
            point1: {
              label: 'point 1',
              desc: 'pair of coordinate points separated by commas or spaces',
              default: '150,160',
              type: 'coordinatePair',
              proxy_attribute: 'points',
            },
            point2: {
              label: 'point 2',
              desc: 'pair of coordinate points separated by commas or spaces',
              default: '173,200',
              type: 'coordinatePair',
              proxy_attribute: 'points',
            },
            point3: {
              label: 'point 3',
              desc: 'pair of coordinate points separated by commas or spaces',
              default: '127,200',
              type: 'coordinatePair',
              proxy_attribute: 'points',
            },
          },
          properties: {
            'fill': {
              default: 'orange',
              type: 'color'
            },
            'stroke': {
              default: 'brown',
              type: 'color'
            },
            'stroke-width': {
              default: 1,
              type: Number,
            },
          },
        },
      },
      attributes: {
        id: {
          label: 'id',
          desc: 'id',
          default: '<shape>',
          type: String,
        },
        title: {
          label: 'title',
          desc: 'title',
          default: '<shape>',
          type: String,
        },

      }
    };
  }

  /**
   * Returns elementSchema object
   */
  getElementSchema() {
    return this.elementSchema;
  }

}
