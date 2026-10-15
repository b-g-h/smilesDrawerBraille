/**
 * BrailleSvgWrapper — erweitert SvgWrapper für taktile Braille-Ausgabe.
 *
 * Änderungen zum Standard:
 *   • CSS-Font auf Euro850 (24 pt) umgestellt
 *   • Keine Unicode-Sub-/Superscripts (Braille-Fonts rendern die meist falsch)
 *   • Alle Texte / Linien / Kreise sind per Theme bereits schwarz
 *   • Dickere, taktile Linien via höherer bondThickness
 *   • KEINE SVG-Masken → bessere Inkscape-Kompatibilität
 *   • Transform als SVG-Attribut statt CSS-Style
 */
export default class BrailleSvgWrapper extends SvgWrapper {
    textFontFamily: string;
    /**
     * Zeichnet Atomsymbole ohne Unicode-Ladungs-/Isotop-Zeichen,
     * damit der Braille-Font korrekt rendern kann.
     */
    drawText(x: any, y: any, elementName: any, hydrogens: any, direction: any, isTerminal: any, charge: any, isotope: any, totalVertices: any, attachedPseudoElement?: {}): void;
    _bboxMeasured: boolean;
    /**
     * Ringe schwarz zeichnen (Original nutzt themeManager.getColor('C')).
     */
    drawRing(x: any, y: any, s: any): void;
    /**
     * Punkte (implizite C-Atome) schwarz.
     */
    drawPoint(x: any, y: any, elementName: any): void;
    /**
     * Bälle (atomVisualization === 'balls') schwarz.
     */
    drawBall(x: any, y: any, elementName: any): void;
}
import SvgWrapper from './SvgWrapper';
