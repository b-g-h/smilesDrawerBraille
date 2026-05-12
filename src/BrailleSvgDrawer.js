// @ts-check
import SvgDrawer from './SvgDrawer';
import BrailleSvgWrapper from './BrailleSvgWrapper';
import ThemeManager from './ThemeManager';

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
    constructor(options, clear = true) {
        // Sicherstellen, dass Braille-Defaults angewendet werden
        const brailleDefaults = {
            fontFamily: 'Euro850, Arial, sans-serif',
            fontSizeLarge: 24,
            fontSizeSmall: 8,
            bondThickness: 2.0,
            bondLength: 45,
            padding: 20.0,
        };
        const merged = Object.assign({}, brailleDefaults, options);
        super(merged, clear);
    }

    draw(data, target, themeName = 'braille', weights = null, infoOnly = false, highlight_atoms = [], weightsNormalized = false) {
        if (target === null || target === 'svg') {
            target = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            target.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            target.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            target.setAttributeNS(null, 'width', this.opts.width);
            target.setAttributeNS(null, 'height', this.opts.height);
        } else if (target instanceof String) {
            target = document.getElementById(target);
        }

        let optionBackup = {
            padding: this.opts.padding,
            compactDrawing: this.opts.compactDrawing,
        };

        if (weights !== null) {
            this.opts.padding += this.opts.weights.additionalPadding;
            this.opts.compactDrawing = false;
        }

        let preprocessor = this.preprocessor;
        preprocessor.initDraw(data, 'braille', infoOnly, highlight_atoms);

        if (!infoOnly) {
            this.themeManager = new ThemeManager(this.opts.themes, 'braille');
            if (this.svgWrapper === null || this.clear) {
                this.svgWrapper = new BrailleSvgWrapper(this.themeManager, target, this.opts, this.clear);
            }
        }

        preprocessor.processGraph();
        this.svgWrapper.determineDimensions(preprocessor.graph.vertices);

        this.drawAtomHighlights(preprocessor.opts.debug);
        this.drawEdges(preprocessor.opts.debug);
        this.drawVertices(preprocessor.opts.debug);

        if (weights !== null) {
            this.drawWeights(weights, weightsNormalized);
        }

        if (preprocessor.opts.debug) {
            console.debug('BrailleSvgDrawer::draw()', {
                graph: preprocessor.graph,
                rings: preprocessor.rings,
                ringConnections: preprocessor.ringConnections,
            });
        }

        this.svgWrapper.constructSvg();

        if (weights !== null) {
            this.opts.padding = optionBackup.padding;
            this.opts.compactDrawing = optionBackup.compactDrawing;
        }

        return target;
    }
}
