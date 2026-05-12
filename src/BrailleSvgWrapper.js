import SvgWrapper from './SvgWrapper';
import MathHelper from './MathHelper';

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
    constructor(themeManager, target, options, clear = true) {
        super(themeManager, target, options, clear);

        // Euro850-Style injizieren (überschreibt den vom Konstruktor gesetzten Style)
        this.style.textContent = `
            .element {
                font: ${this.opts.fontSizeLarge}pt ${this.opts.fontFamily};
                font-weight: normal;
            }
            .sub {
                font: ${this.opts.fontSizeSmall}pt ${this.opts.fontFamily};
            }
        `;
    }

    /**
     * Zeichnet Atomsymbole ohne Unicode-Ladungs-/Isotop-Zeichen,
     * damit der Braille-Font korrekt rendern kann.
     */
    drawText(x, y, elementName, hydrogens, direction, isTerminal, charge, isotope, totalVertices, attachedPseudoElement = {}) {
        let text = [];
        let display = elementName;

        // Ladungen als normale ASCII-Zeichen statt Unicode-Superscript
        if (charge !== 0 && charge !== null) {
            if (charge === 1)       display += '+';
            else if (charge === -1) display += '-';
            else if (charge > 1)    display += '+' + charge;
            else                    display += charge;   // negative Zahl mit Minus
        }

        // Isotop als normale Vorsilbe statt Superscript
        if (isotope !== 0 && isotope !== null) {
            display = isotope + display;
        }

        text.push([display, elementName]);

        if (hydrogens === 1) {
            text.push(['H', 'H']);
        } else if (hydrogens > 1) {
            text.push(['H' + hydrogens, 'H']);
        }

        // Nitro-Ausnahme (wie im Original)
        if (charge === 1 && elementName === 'N' && '0O' in attachedPseudoElement && '0O-1' in attachedPseudoElement) {
            attachedPseudoElement = {
                '0O': { element: 'O', count: 2, hydrogenCount: 0, previousElement: 'C', charge: '' }
            };
            charge = 0;
        }

        for (let key of Object.keys(attachedPseudoElement)) {
            let pe = attachedPseudoElement[key];
            let pe_display = pe.element;

            if (pe.count > 1) {
                pe_display += pe.count;
            }

            if (pe.charge) {
                if (pe.charge === 1)      pe_display += '+';
                else if (pe.charge === -1) pe_display += '-';
                else                       pe_display += pe.charge;
            }

            text.push([pe_display, pe.element]);

            const hcount = pe.hydrogenCount * pe.count;
            if (hcount === 1) {
                text.push(['H', 'H']);
            } else if (hcount > 1) {
                text.push(['H' + hcount, 'H']);
            }
        }

        this.write(text, direction, x, y, totalVertices === 1);
    }

    /**
     * Überschreibt write():
     *   • Keine Masken-Elemente (Inkscape-Kompatibilität)
     *   • Text direkt schwarz statt weiß+schwarzer tspan
     *   • Transform als SVG-Attribut statt CSS-Style
     */
    write(text, direction, x, y, singleVertex) {
        let bbox = SvgWrapper.measureText(text[0][1], this.opts.fontSizeLarge, this.opts.fontFamily);

        if (direction === 'left' && text[0][0] !== text[0][1]) {
            let fullBbox = SvgWrapper.measureText(text[0][0], this.opts.fontSizeLarge, this.opts.fontFamily);
            bbox.width = fullBbox.width;
        }

        // Bounding-Box-Berechnung (identisch zum Original)
        if (singleVertex) {
            if (x + bbox.width * text.length > this.maxX) this.maxX = x + bbox.width * text.length;
            if (x - bbox.width / 2.0 < this.minX) this.minX = x - bbox.width / 2.0;
            if (y - bbox.height < this.minY) this.minY = y - bbox.height;
            if (y + bbox.height > this.maxY) this.maxY = y + bbox.height;
        } else {
            if (direction !== 'right') {
                if (x + bbox.width * text.length > this.maxX) this.maxX = x + bbox.width * text.length;
                if (x - bbox.width * text.length < this.minX) this.minX = x - bbox.width * text.length;
            } else if (direction !== 'left') {
                if (x + bbox.width * text.length > this.maxX) this.maxX = x + bbox.width * text.length;
                if (x - bbox.width / 2.0 < this.minX) this.minX = x - bbox.width / 2.0;
            }
            if (y - bbox.height < this.minY) this.minY = y - bbox.height;
            if (y + bbox.height > this.maxY) this.maxY = y + bbox.height;
            if (direction === 'down') {
                if (y + 0.8 * bbox.height * text.length > this.maxY) {
                    this.maxY = y + 0.8 * bbox.height * text.length;
                }
            }
            if (direction === 'up') {
                if (y - 0.8 * bbox.height * text.length < this.minY) {
                    this.minY = y - 0.8 * bbox.height * text.length;
                }
            }
        }

        let textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElem.setAttributeNS(null, 'class', 'element');
        // Direkt schwarz – kein weißer Text mehr
        textElem.setAttributeNS(null, 'fill', '#000000');
        let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        if (direction === 'left') {
            text = text.reverse();
        }

        if (direction === 'right' || direction === 'down' || direction === 'up') {
            x -= bbox.width / 2.0;
        }
        if (direction === 'left') {
            x += bbox.width / 2.0;
        }

        text.forEach((part, i) => {
            const display = part[0];
            let tspanElem = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspanElem.textContent = display;

            if (direction === 'up' || direction === 'down') {
                tspanElem.setAttributeNS(null, 'x', '0px');
                if (direction === 'up') {
                    tspanElem.setAttributeNS(null, 'y', `-${0.9 * i}em`);
                } else {
                    tspanElem.setAttributeNS(null, 'y', `${0.9 * i}em`);
                }
            }

            textElem.appendChild(tspanElem);
        });

        textElem.setAttributeNS(null, 'data-direction', direction);

        if (direction === 'left' || direction === 'right') {
            textElem.setAttributeNS(null, 'dominant-baseline', 'alphabetic');
            textElem.setAttributeNS(null, 'y', '0.36em');
        } else {
            textElem.setAttributeNS(null, 'dominant-baseline', 'central');
        }

        if (direction === 'left') {
            textElem.setAttributeNS(null, 'text-anchor', 'end');
        }

        g.appendChild(textElem);
        // Inkscape-kompatibles Transform-Attribut statt CSS-Style
        g.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);

        // Masken-Element für Text-Hintergrund (Linien werden hier ausgeschnitten)
        let maskRadius = this.opts.fontSizeLarge * 0.75;
        if (text[0][1].length > 1) {
            maskRadius = this.opts.fontSizeLarge * 1.1;
        }
        let mask = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mask.setAttributeNS(null, 'cx', x);
        mask.setAttributeNS(null, 'cy', y);
        mask.setAttributeNS(null, 'r', maskRadius);
        mask.setAttributeNS(null, 'fill', 'black');
        this.maskElements.push(mask);

        this.vertices.push(g);
    }

    /**
     * Konstruiert das SVG MIT Masken (wie Original, aber mit korrigiertem Font).
     */
    constructSvg() {
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
            masks = document.createElementNS('http://www.w3.org/2000/svg', 'mask'),
            background = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            highlights = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            paths = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            vertices = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            pathChildNodes = this.paths;

        { // Set up the basic masking layer...
            let mask = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            mask.setAttributeNS(null, 'x', this.minX);
            mask.setAttributeNS(null, 'y', this.minY);
            mask.setAttributeNS(null, 'width', this.maxX - this.minX);
            mask.setAttributeNS(null, 'height', this.maxY - this.minY);
            mask.setAttributeNS(null, 'fill', 'white');

            masks.appendChild(mask);
        }

        // give the mask an id and set bounds explicitly for userSpaceOnUse
        masks.setAttributeNS(null, 'id', this.uid + '-text-mask');
        masks.setAttributeNS(null, 'maskUnits', 'userSpaceOnUse');
        masks.setAttributeNS(null, 'x', this.minX);
        masks.setAttributeNS(null, 'y', this.minY);
        masks.setAttributeNS(null, 'width', this.maxX - this.minX);
        masks.setAttributeNS(null, 'height', this.maxY - this.minY);

        for (let path of pathChildNodes) {
            paths.appendChild(path);
        }

        for (let backgroundItem of this.backgroundItems) {
            background.appendChild(backgroundItem);
        }
        for (let highlight of this.highlights) {
            highlights.appendChild(highlight);
        }
        for (let vertex of this.vertices) {
            vertices.appendChild(vertex);
        }
        for (let mask of this.maskElements) {
            masks.appendChild(mask);
        }
        for (let gradient of this.gradients) {
            defs.appendChild(gradient);
        }

        paths.setAttributeNS(null, 'mask', 'url(#' + this.uid + '-text-mask)');

        this.updateViewbox(this.opts.scale);

        if (this.svg) {
            this.svg.appendChild(defs);
            this.svg.appendChild(masks);
            this.svg.appendChild(background);
            this.svg.appendChild(highlights);
            this.svg.appendChild(paths);
            this.svg.appendChild(vertices);
        } else {
            this.container.appendChild(defs);
            this.container.appendChild(background);
            this.container.appendChild(paths);
            this.container.appendChild(vertices);
            return this.container;
        }
    }

    /**
     * Ringe schwarz zeichnen (Original nutzt themeManager.getColor('C')).
     */
    drawRing(x, y, s) {
        let circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        let radius = MathHelper.apothemFromSideLength(this.opts.bondLength, s);
        circleElem.setAttributeNS(null, 'cx', x);
        circleElem.setAttributeNS(null, 'cy', y);
        circleElem.setAttributeNS(null, 'r', radius - this.opts.bondSpacing);
        circleElem.setAttributeNS(null, 'stroke', '#000000');
        circleElem.setAttributeNS(null, 'stroke-width', this.opts.bondThickness);
        circleElem.setAttributeNS(null, 'fill', 'none');
        this.paths.push(circleElem);
    }

    /**
     * Punkte (implizite C-Atome) schwarz – mit Masken.
     */
    drawPoint(x, y, elementName) {
        let r = 0.75;
        if (x - r < this.minX) this.minX = x - r;
        if (x + r > this.maxX) this.maxX = x + r;
        if (y - r < this.minY) this.minY = y - r;
        if (y + r > this.maxY) this.maxY = y + r;

        // Masken-Element
        let mask = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mask.setAttributeNS(null, 'cx', x);
        mask.setAttributeNS(null, 'cy', y);
        mask.setAttributeNS(null, 'r', '1.5');
        mask.setAttributeNS(null, 'fill', 'black');
        this.maskElements.push(mask);

        let point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttributeNS(null, 'cx', x);
        point.setAttributeNS(null, 'cy', y);
        point.setAttributeNS(null, 'r', r);
        point.setAttributeNS(null, 'fill', '#000000');
        this.vertices.push(point);
    }

    /**
     * Bälle (atomVisualization === 'balls') schwarz – mit Masken.
     */
    drawBall(x, y, elementName) {
        let r = this.opts.bondLength / 4.5;
        if (x - r < this.minX) this.minX = x - r;
        if (x + r > this.maxX) this.maxX = x + r;
        if (y - r < this.minY) this.minY = y - r;
        if (y + r > this.maxY) this.maxY = y + r;

        // Masken-Element
        let mask = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mask.setAttributeNS(null, 'cx', x);
        mask.setAttributeNS(null, 'cy', y);
        mask.setAttributeNS(null, 'r', r);
        mask.setAttributeNS(null, 'fill', 'black');
        this.maskElements.push(mask);

        let ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ball.setAttributeNS(null, 'cx', x);
        ball.setAttributeNS(null, 'cy', y);
        ball.setAttributeNS(null, 'r', r);
        ball.setAttributeNS(null, 'fill', '#000000');
        this.vertices.push(ball);
    }
}
