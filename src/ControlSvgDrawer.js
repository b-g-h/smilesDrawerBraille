import BrailleSvgDrawer from './BrailleSvgDrawer';

/**
 * ControlSvgDrawer — erweitert BrailleSvgDrawer für eine Kontroll-Darstellung
 * mit Standardfont statt Braille-Font.
 *
 * Behält alle taktile Defaults bei (bondLength 45, bondThickness 2.0,
 * fontSizeLarge 24, weiße Rechtecke hinter Text, schwarze Linien).
 * Nach dem Rendern wird der Euro850-Font im SVG-DOM durch Arial ersetzt.
 */
export default class ControlSvgDrawer extends BrailleSvgDrawer {
    constructor(options, clear = true) {
        const controlDefaults = {
            fontFamily: "Arial, Helvetica, sans-serif",
        };
        const merged = Object.assign({}, controlDefaults, options);
        super(merged, clear);
    }

    draw(data, target, themeName = 'braille', weights = null, infoOnly = false, highlight_atoms = [], weightsNormalized = false) {
        const svg = super.draw(data, target, themeName, weights, infoOnly, highlight_atoms, weightsNormalized);

        if (!infoOnly && svg instanceof SVGElement) {
            // 1) font-family Attribute auf allen <text> Elementen ersetzen
            const texts = svg.querySelectorAll('text');
            texts.forEach(text => {
                text.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
            });

            // 2) Inline-Style im SVG aktualisieren
            const style = svg.querySelector('style');
            if (style) {
                style.textContent = style.textContent.replace(
                    /font:\s*\d+pt\s+['"]?Euro850['"]?,?\s*['"]?Euro-850['"]?,?\s*Arial,?\s*sans-serif;?/g,
                    `font: ${this.opts.fontSizeLarge}pt Arial, Helvetica, sans-serif;`
                );
                style.textContent = style.textContent.replace(
                    /font-family:\s*['"]?Euro850['"]?,?\s*['"]?Euro-850['"]?,?\s*Arial,?\s*sans-serif;?/g,
                    `font-family: Arial, Helvetica, sans-serif;`
                );
            }
        }

        return svg;
    }
}
