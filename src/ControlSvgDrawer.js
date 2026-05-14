import BrailleSvgDrawer from './BrailleSvgDrawer';
import ControlSvgWrapper from './ControlSvgWrapper';

/**
 * ControlSvgDrawer — erweitert BrailleSvgDrawer für eine Kontroll-Darstellung
 * mit Standardfont statt Braille-Font.
 *
 * Behält alle taktile Defaults bei (bondLength 45, bondThickness 2.0,
 * fontSizeLarge 24, weiße Rechtecke hinter Text, schwarze Linien).
 * Verwendet ControlSvgWrapper, der den Font-Stack auf Arial setzt.
 */
export default class ControlSvgDrawer extends BrailleSvgDrawer {
    constructor(options, clear = true) {
        const controlDefaults = {
            fontFamily: "Arial, Helvetica, sans-serif",
        };
        const merged = Object.assign({}, controlDefaults, options);
        super(merged, clear);
    }

    createSvgWrapper(themeManager, target, options, clear) {
        return new ControlSvgWrapper(themeManager, target, options, clear);
    }
}
