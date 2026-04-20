import Poco from "commodetto/Poco";
import Button from "pebble/button"

import { NumericRoller, ValueRoller } from "./dice";

// TODO: Use pre-processor directives to figure out which sensors are available

const render = new Poco(screen);
const centerX = render.width/2;
const centerY = render.height/2;

let selected = false; // has a dice been selected from the menu
let index = 0; // dice menu position

const font = new render.Font("Gothic-Bold", 18);
const fontHeight = 18; // emery height
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const d20_pdc = new Poco.PebbleDrawCommandImage(1);
const d12_pdc = new Poco.PebbleDrawCommandImage(2);
const d10_pdc = new Poco.PebbleDrawCommandImage(3);
const d08_pdc = new Poco.PebbleDrawCommandImage(4);
const d06_pdc = new Poco.PebbleDrawCommandImage(5);
const d04_pdc = new Poco.PebbleDrawCommandImage(6);

const d20_obj = new NumericRoller(render, "D20", render.makeColor(170, 0, 255), d20_pdc, 1, 20);
const d12_obj = new NumericRoller(render, "D12", render.makeColor(255, 0, 85), d12_pdc, 1, 12);
const d10_obj = new NumericRoller(render, "D10", render.makeColor(255, 170, 0), d10_pdc, 1, 10);
const d08_obj = new NumericRoller(render, "D08", render.makeColor(0, 170, 0), d08_pdc, 1, 8);
const d06_obj = new NumericRoller(render, "D06", render.makeColor(0, 255, 255), d06_pdc, 1, 6);
const d04_obj = new NumericRoller(render, "D04", render.makeColor(0, 85, 255), d04_pdc, 1, 4);

const createMenu = (items) => {
	let index = 0;
	return {
	  next:    () => { index = (index + 1) % items.length; },
	  prev:    () => { index = (index - 1 + items.length) % items.length; },
	  peakNext: () => items[(index + 1) % items.length],
	  peakPrev: () => items[(index - 1 + items.length) % items.length],
	  current: () => items[index],
	};
  };

const dice_menu = createMenu([d20_obj, d12_obj, d10_obj, d08_obj, d06_obj, d04_obj]);

function drawDice(entity, movement, options = {}) {

	const {
		dice_scale, // scale icon independently (% of total screen size)
		txt_offset_y = 0, // move txt independently in y direction
	} = options;

	const dice_y_exage = 1.15;
	const text_x_exage = 1.25

	// scale if needed
	const { icon: displayDice, icon_w: displayDice_w, icon_h: displayDice_h } = 
    dice_scale ? entity.rescale(render, dice_scale) : entity;

	console.log("drawDice: " + displayDice_w);
	console.log("drawDice: " + displayDice_h);

    // Draw icon with movement offset
    render.drawDCI(
        displayDice,
        centerX - displayDice_w / 2,
        centerY - displayDice_h / 2 + movement,
    );

    // Draw styling box for text with distinct offset
    const textWidth = render.getTextWidth(entity.name, font);
    render.drawRoundRect(
        centerX - (textWidth / 2) * text_x_exage,
        centerY + (displayDice_h / 2) * dice_y_exage + movement + txt_offset_y,
        textWidth * text_x_exage,
        fontHeight * dice_y_exage,
        entity.color,
        4,
        0b1111
    );

    // Draw text with distinct offset
    render.drawText(
        entity.name,
        font,
        black,
        centerX - textWidth / 2,
        centerY + (displayDice_h / 2) * dice_y_exage + movement + txt_offset_y,
    );
}

function rotate_menu(direction) {
    const animation_start = Date.now();
    const duration = 250;

	const incoming = direction ? dice_menu.peakNext() : dice_menu.peakPrev();
    const outgoing = dice_menu.current();

	// outgoingOffset: full icon height + (half screen height)*120% to ensure it's off-screen
	const travel = centerY + (outgoing.icon_h / 2)*1.2 + fontHeight;

    const interval = setInterval(() => {
        const elapsed = Math.min(Date.now() - animation_start, duration);
        const progress = elapsed / duration;

        // Eased progress (ease-in-out)
        const eased = Math.backEaseOut(progress);

        const outgoingOffset = direction
            ? eased * travel          // downward: moves from center to off bottom
            : eased * -travel;        // upward: moves from center to off top

        render.begin();

        // Clear screen
        render.fillRectangle(white, 0, 0, render.width, render.height);

        drawDice(outgoing, outgoingOffset);

        // Draw next or previous icon sliding in from opposite side
        const incomingOffset = direction
            ? -travel + eased * travel    // from above, moving down to center
            : travel - eased * travel;    // from below, moving up to center

		drawDice(incoming, incomingOffset)
			
        render.end();

        // Stop the interval when animation is complete
        if (elapsed >= duration) {
            clearInterval(interval);
        }

    }, 50);
}

function dice_result(role_result) {
	console.log("role_graphic: " + role_result);
	// Draw styling box for text with distinct offset
    const textWidth = render.getTextWidth(role_result, font);
	const entity = dice_menu.current();
	render.begin();
	console.log("role_graphic: " + textWidth);
	console.log("role_graphic: " + fontHeight);
    render.drawRoundRect(
        centerX - (textWidth / 2),
        centerY,
        textWidth * 1.25,
        fontHeight * 1.15,
        entity.color,
        4,
        0b1111
    );

    // Draw text with distinct offset
    render.drawText(
        role_result,
        font,
        black,
        centerX - textWidth / 2,
        centerY,
    );
	render.end();
}

function select_transition(direction) {
	// direction -> expand
	// !direction -> collapse

	const animation_start = Date.now();
    const duration = 300;

	const selected = dice_menu.current();

	const large_dice = 0.8;
	const dice_difference = large_dice - 0.55;
	const text_offscreen_y = render.height;

	const interval = setInterval(() => {
		render.begin();

		// clear screen
		render.fillRectangle(white, 0, 0, render.width, render.height);

		const elapsed = Math.min(Date.now() - animation_start, duration);
        const progress = elapsed / duration;

        // Eased progress (ease-in-out)
        const eased = Math.backEaseOut(progress);

		const selectedScale = direction
			? 0.55 + eased * dice_difference
			: 0.55 + (1 - eased) * dice_difference;
		const selectedTxtY = direction
			? eased * text_offscreen_y
			: (1 - eased) * text_offscreen_y;

		console.log("select transit - txtY: " + selectedTxtY);

		drawDice(selected, 0, { dice_scale: selectedScale, txt_offset_y: selectedTxtY });

        render.end();

        // Stop the interval when animation is complete
        if (elapsed >= duration) {
            clearInterval(interval);
        }

	}, 50);
}

render.begin();
drawDice(dice_menu.current(), 0);
render.end();

new Button({
	// TODO: learn how to properly exit the app using the back button
    types: ["select", "up", "down"],
    onPush(down, type) {
		if (!down) return; // only run on button press, not release

		//draw_menu();
        if (selected){
			// Roll //
			// up/down -> Dice Menu
			// select -> role
			console.log((down ? "press " : "release ") + type);
			console.log("selected: ", selected);
			
			if (type === "select"){
				dice_menu.current().seed();
				console.log("ROLLED");
				console.log("dice: ", dice_menu.current().name);
				dice_result(dice_menu.current().role());
			}

			else if (type === "up" || type === "down"){
				console.log("back -> Dice Menu");
				selected = false;
				select_transition(selected);
			}
		}

		else {
			// Dice Menu //
			// up/down select dice
			// select -> Roll

			if (type === "select"){
				console.log("DICE SELECTED");
				console.log("dice: ", dice_menu.current().name);
				selected = true;
				select_transition(selected)
			}
			
			else if (type === "up"){
				rotate_menu(false);
				dice_menu.prev();
			}
			
			else if (type === "down"){
				rotate_menu(true);
				dice_menu.next();
			}

		}

		dice_menu.current().debug_chance();
    }
});
