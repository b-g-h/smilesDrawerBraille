/**
 * ControlSvgDrawer — erweitert BrailleSvgDrawer für eine Kontroll-Darstellung
 * mit Standardfont statt Braille-Font.
 *
 * Behält alle taktile Defaults bei (bondLength 45, bondThickness 2.0,
 * fontSizeLarge 24, weiße Rechtecke hinter Text, schwarze Linien).
 * Verwendet ControlSvgWrapper, der den Font-Stack auf Arial setzt.
 */
export default class ControlSvgDrawer extends BrailleSvgDrawer {
}
import BrailleSvgDrawer from './BrailleSvgDrawer';
