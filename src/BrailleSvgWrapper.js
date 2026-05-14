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

        // Font-Stack für SVG-Text-Attribute (wird von ControlSvgWrapper überschrieben)
        this.textFontFamily = "'Euro850', 'Euro-850', Arial, sans-serif";

        // Euro850-Style injizieren (überschreibt den vom Konstruktor gesetzten Style)
        // WICHTIG: Wir entfernen das CSS-Styling hier, weil es den Font
        // auf Attribut-Ebene überschreibt. Der Font wird stattdessen direkt
        // auf jedem <text>-Element als SVG-Attribut gesetzt (siehe write()).
        this.style.textContent = '';
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

        // Volle Breite des angezeigten Textes verwenden (relevant für Ladungen/Isotope)
        if (text[0][0] !== text[0][1]) {
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
        // Font-Attribute explizit setzen (svg2pdf liest keine CSS-Klassen)
        textElem.setAttributeNS(null, 'font-family', this.textFontFamily);
        textElem.setAttributeNS(null, 'font-size', this.opts.fontSizeLarge + 'pt');
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

        let firstDisplay = text[0][0];

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

        // Weißer Hintergrund mit abgerundeten Ecken verdeckt Bindungslinien hinter dem Text
        let padding = 5;
        let rx_rect, ry_rect;

        if (direction === 'up' || direction === 'down') {
            // Vertikal gestapelter Text
            rx_rect = bbox.width + padding * 2;
            ry_rect = bbox.height * text.length + padding * 2;
        } else {
            // Horizontal nebeneinander
            rx_rect = bbox.width * text.length + padding * 2;
            ry_rect = bbox.height * 1.2 + padding * 2;
        }

        let bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

        // Rechteck-Position muss zur Text-Position passen
        let rectX, rectY;
        let textWidth = bbox.width;
        if (text.length > 1 && (direction === 'left' || direction === 'right')) {
            textWidth = bbox.width * text.length;
        }

        if (direction === 'left') {
            // text-anchor="end" → Text endet bei x=0, liegt also links davon
            rectX = -textWidth - padding;
        } else if (direction === 'right') {
            // text-anchor="start" (default) → Text startet bei x=0, liegt rechts davon
            rectX = -padding;
        } else if (direction === 'up' || direction === 'down') {
            // up/down: Text ist bei x=0 linksbündig (tspan x="0px")
            rectX = -padding;
        } else {
            rectX = -rx_rect / 2;
        }

        if (direction === 'left' || direction === 'right') {
            // Text-Baseline bei y = 0.36em, Box weiter nach unten verschoben
            const emPx = this.opts.fontSizeLarge * (96 / 72);
            const textTop = 0.36 * emPx - bbox.height * 0.7;
            rectY = textTop - padding;
        } else {
            // up/down: zentriert um y=0 (dominant-baseline="central")
            rectY = -ry_rect / 2;
        }

        bg.setAttributeNS(null, 'x', rectX);
        bg.setAttributeNS(null, 'y', rectY);
        bg.setAttributeNS(null, 'width', rx_rect);
        bg.setAttributeNS(null, 'height', ry_rect);
        bg.setAttributeNS(null, 'rx', 4);
        bg.setAttributeNS(null, 'ry', 4);
        bg.setAttributeNS(null, 'fill', '#ffffff');
        g.insertBefore(bg, textElem);

        g.setAttributeNS(null, 'role', 'group');
        g.setAttributeNS(null, 'aria-label', firstDisplay + ' Atom');

        this.vertices.push(g);
    }

    /**
     * Überschreibt updateViewbox():
     *   • Keine Skalierung — width/height des SVG werden auf die natürliche
     *     ViewBox-Größe gesetzt, damit der Text immer exakt 24 pt bleibt.
     */
    updateViewbox(scale) {
        let x = this.minX;
        let y = this.minY;
        let width = this.maxX - this.minX;
        let height = this.maxY - this.minY;

        if (width > height) {
            let diff = width - height;
            height = width;
            y -= diff / 2.0;
        } else {
            let diff = height - width;
            width = height;
            x -= diff / 2.0;
        }

        this.svg.setAttributeNS(null, 'viewBox', `${x} ${y} ${width} ${height}`);
        // Natürliche Größe → keine Browser-Skalierung, Text bleibt 24 pt
        this.svg.setAttributeNS(null, 'width', width);
        this.svg.setAttributeNS(null, 'height', height);
        if (this.svg.style) {
            this.svg.style.width = '';
            this.svg.style.height = '';
        }
    }

    /**
     * Konstruiert das SVG OHNE Masken.
     * Reihenfolge: defs → background → highlights → paths → vertices
     * (vertices überdecken paths, also überdeckt der Text die Bindungslinien)
     */
    constructSvg() {
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
            background = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            highlights = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            paths = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            vertices = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            pathChildNodes = this.paths;

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
        for (let gradient of this.gradients) {
            defs.appendChild(gradient);
        }

        paths.setAttributeNS(null, 'role', 'group');
        paths.setAttributeNS(null, 'aria-label', 'Bindungen');
        vertices.setAttributeNS(null, 'role', 'group');
        vertices.setAttributeNS(null, 'aria-label', 'Atome und Elemente');

        this.updateViewbox(this.opts.scale);

        if (this.svg) {
            this.svg.appendChild(defs);
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
     * Punkte (implizite C-Atome) schwarz.
     */
    drawPoint(x, y, elementName) {
        let r = 0.75;
        if (x - r < this.minX) this.minX = x - r;
        if (x + r > this.maxX) this.maxX = x + r;
        if (y - r < this.minY) this.minY = y - r;
        if (y + r > this.maxY) this.maxY = y + r;

        let point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttributeNS(null, 'cx', x);
        point.setAttributeNS(null, 'cy', y);
        point.setAttributeNS(null, 'r', r);
        point.setAttributeNS(null, 'fill', '#000000');
        this.vertices.push(point);
    }

    /**
     * Bälle (atomVisualization === 'balls') schwarz.
     */
    drawBall(x, y, elementName) {
        let r = this.opts.bondLength / 4.5;
        if (x - r < this.minX) this.minX = x - r;
        if (x + r > this.maxX) this.maxX = x + r;
        if (y - r < this.minY) this.minY = y - r;
        if (y + r > this.maxY) this.maxY = y + r;

        let ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ball.setAttributeNS(null, 'cx', x);
        ball.setAttributeNS(null, 'cy', y);
        ball.setAttributeNS(null, 'r', r);
        ball.setAttributeNS(null, 'fill', '#000000');
        this.vertices.push(ball);
    }
}
