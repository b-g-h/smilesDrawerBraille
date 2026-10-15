/**
 * BrailleSvgDrawer — erweitert SvgDrawer für taktile Braille-Darstellung.
 *
 * Nutzt BrailleSvgWrapper statt SvgWrapper und erzwingt das 'braille'-Theme.
 * Setzt außerdem sinnvolle Defaults für taktile Ausgabe:
 *   • bondLength 45   (größerer Abstand für Tastenpunkte)
 *   • bondThickness 2.0  (dickere Linien)
 *   • fontSizeLarge 24   (Euro850 in 24 pt)
 *   • padding 20
 */
export default class BrailleSvgDrawer extends SvgDrawer {
    draw(data: any, target: any, themeName?: string, weights?: any, infoOnly?: boolean, highlight_atoms?: any[], weightsNormalized?: boolean): any;
    createSvgWrapper(themeManager: any, target: any, options: any, clear: any): BrailleSvgWrapper;
}
import SvgDrawer from './SvgDrawer';
import BrailleSvgWrapper from './BrailleSvgWrapper';
