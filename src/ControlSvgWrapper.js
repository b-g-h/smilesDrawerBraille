import BrailleSvgWrapper from './BrailleSvgWrapper';

/**
 * ControlSvgWrapper — erweitert BrailleSvgWrapper für eine Kontroll-Darstellung.
 * Verwendet einen Standardfont (Arial) statt Braille-Font.
 */
export default class ControlSvgWrapper extends BrailleSvgWrapper {
    constructor(themeManager, target, options, clear = true) {
        super(themeManager, target, options, clear);
        this.textFontFamily = "Arial, Helvetica, sans-serif";
    }
}
