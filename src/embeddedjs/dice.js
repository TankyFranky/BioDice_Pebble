// Class components related to dice and chance item representation

function placeAroundCircle(render, count, diameter, options = {}) {
    const {
      centerX = 0,
      centerY = 0,
      startAngle = 0,
      font = new render.Font("Gothic-Bold", 18),
    } = options;
  
    const radius = diameter / 2;
    const points = [];
  
    for (let i = 0; i < count; i++) {
      // Divide the full 360° into `count` equal slices
      const angleDeg = startAngle + (360 / count) * i;
  
      // find the offset for the specific number
      const w_text = render.getTextWidth( (i + 1), font);

      // Convert to radians. Subtract 90° so index 0 starts at the top.
      const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  
      const x = centerX + radius * Math.cos(angleRad) - w_text/2;
      const y = centerY + radius * Math.sin(angleRad);
  
      points.push({
        number: i + 1,
        x: parseFloat(x.toFixed(4)),
        y: parseFloat(y.toFixed(4)),
        w: parseFloat(w_text.toFixed(4)),
      });
    }
  
    return points;
  }

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Chance{
    // A basic item of chance
    // TODO: scale should be a global
    constructor(render, name, color, icon, scale = 0.55) {
        this.name = name; // string name for the chance item
        this.color = color; // PebbleSDK constant color
        
        // compute scale
        this.icon_scale = (render.width*scale)/icon.width
        this.icon_orig = icon;
        this.icon = icon.clone().scale(this.icon_scale);

        this.icon_w = icon.width * this.icon_scale;
        this.icon_h = icon.height * this.icon_scale;

    }

    seed() {
      this.s_rand = mulberry32(Date.now());
    }

    role() {
      return Math.floor(this.s_rand() * (this.max - this.min + 1)) + this.min;
    }

    rescale(render, scale = 0.55) {

      const icon_scale = (render.width * scale) / this.icon_orig.width;
  
      const rescaled_icon = this.icon_orig.clone().scale(icon_scale);
  
      const rescaled_icon_w = this.icon_orig.width * icon_scale;
      const rescaled_icon_h = this.icon_orig.height * icon_scale;
  
      return { icon: rescaled_icon, icon_w: rescaled_icon_w, icon_h: rescaled_icon_h };
    }

    debug_chance() {
        console.log("==================");
        console.log("DICE: " + this.name);
        console.log("   color: " + this.color);
        console.log("   icon_w: " + this.icon_w);
        console.log("   icon_h: " + this.icon_h);
        console.log("   icon_scale: " + this.icon_scale);
    }

  }
  
export class NumericRoller extends Chance {
    // A number based item of chance (e.g. a Dice)
    constructor(render, name, color, icon, min, max){
        super(render, name, color, icon);
        this.min = min;
        this.max = max;
        this.count = max - min + 1;
    }

    debug_chance() {
        super.debug_chance();
        console.log("   max_val: " + this.max);
        console.log("   min_val: " + this.min);
    }
}

export class ValueRoller extends Chance {
    // A non-numeric based item of chance (e.g. a coin)
    constructor(name, color, icon, values){
        super(name, color, icon);
        this.values = values; // a list of possible values
    }
}
