import BrailleSvgDrawer from './BrailleSvgDrawer';

/**
 * ControlSvgDrawer — erweitert BrailleSvgDrawer für eine Kontroll-Darstellung
 * mit Standardfont statt Braille-Font.
 *
 * Behält alle taktile Defaults bei (bondLength 45, bondThickness 2.0,
 * fontSizeLarge 24, weiße Rechtecke hinter Text, schwarze Linien),
 * verwendet aber einen Systemschrift-Font zur visuellen Kontrolle.
 */
export default class ControlSvgDrawer extends BrailleSvgDrawer {
    constructor(options, clear = true) {
        const controlDefaults = {
            fontFamily: "Arial, Helvetica, sans-serif",
        };
        const merged = Object.assign({}, controlDefaults, options);
        super(merged, clear);
    }
}
