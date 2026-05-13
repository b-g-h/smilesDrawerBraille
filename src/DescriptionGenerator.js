/**
 * Generiert eine natürlichsprachliche Beschreibung eines Moleküls
 * auf Basis des geparsten Graphen, Ringe und Kanten.
 */
export default class DescriptionGenerator {
    /**
     * @param {Graph} graph
     * @param {Ring[]} rings
     * @param {Edge[]} edges
     * @param {String} smiles
     */
    constructor(graph, rings, edges, smiles) {
        this.graph = graph;
        this.rings = rings || [];
        this.edges = edges || [];
        this.smiles = smiles || '';
    }

    /**
     * Hauptmethode – liefert einen deutschen Beschreibungstext.
     * @returns {String}
     */
    generate() {
        const parts = [];

        parts.push(this._describeComposition());
        parts.push(this._describeRings());
        parts.push(this._describeFunctionalGroups());
        parts.push(this._describeBonds());
        parts.push(this._describeStereo());

        return parts.filter(p => p).join(' ');
    }

    _describeComposition() {
        const vertices = this.graph.vertices;
        const total = vertices.length;
        if (total === 0) return '';

        const elements = {};
        for (const v of vertices) {
            const el = v.value.element;
            elements[el] = (elements[el] || 0) + 1;
        }

        const elementList = Object.entries(elements)
            .sort((a, b) => b[1] - a[1])
            .map(([el, count]) => {
                const name = this._elementName(el);
                return count === 1 ? `ein ${name}` : `${count} ${name}`;
            });

        let text = `Das Molekül besteht aus insgesamt ${total} Atom${total !== 1 ? 'en' : ''}`;
        if (elementList.length > 0) {
            text += `: ${this._joinList(elementList)}`;
        }
        text += '.';
        return text;
    }

    _describeRings() {
        if (this.rings.length === 0) return '';

        const ringDescs = this.rings.map(ring => {
            const size = ring.members.length;
            const isAromatic = ring.isBenzeneLike ? ring.isBenzeneLike(this.graph.vertices) : false;
            const isBridged = ring.isBridged;
            const isFused = ring.isFused;
            const isSpiro = ring.isSpiro;

            let type = isAromatic ? 'aromatischer' : 'aliphatischer';
            let shape = '';
            if (size === 3) shape = 'Dreiring';
            else if (size === 4) shape = 'Vierring';
            else if (size === 5) shape = 'Fünfring';
            else if (size === 6) shape = 'Sechsring';
            else if (size === 7) shape = 'Siebenring';
            else shape = `${size}er-Ring`;

            let desc = `${type} ${shape}`;

            const ringElements = {};
            for (const vid of ring.members) {
                const el = this.graph.vertices[vid].value.element;
                if (el !== 'C') ringElements[el] = (ringElements[el] || 0) + 1;
            }
            const heteroList = Object.entries(ringElements).map(([el, count]) => {
                return count === 1 ? this._elementName(el) : `${count} ${this._elementName(el)}`;
            });
            if (heteroList.length > 0) {
                desc += ` mit ${this._joinList(heteroList)}`;
            }

            if (isBridged) desc += ', verbrückt';
            if (isFused) desc += ', anelliert';
            if (isSpiro) desc += ', spiro-verknüpft';

            return desc;
        });

        return `Es enthält ${this.rings.length} Ring${this.rings.length !== 1 ? 'e' : ''}: ${this._joinList(ringDescs)}.`;
    }

    _describeFunctionalGroups() {
        const groups = [];

        if (this._hasGroup('C(=O)O')) groups.push('eine Carboxylgruppe');
        else if (this._hasGroup('C(=O)')) groups.push('eine Carbonylgruppe');

        if (this._hasGroup('O', true)) {
            const ohCount = this._countOHGroups();
            if (ohCount === 1) groups.push('eine Hydroxylgruppe');
            else if (ohCount > 1) groups.push(`${ohCount} Hydroxylgruppen`);
        }

        if (this._hasGroup('N', true)) {
            const nCount = this._countNitrogenGroups();
            if (nCount === 1) groups.push('ein Stickstoffatom in einer funktionellen Gruppe');
            else if (nCount > 1) groups.push(`${nCount} Stickstoffatome in funktionellen Gruppen`);
        }

        if (this._hasEther()) groups.push('eine Etherbindung');

        if (groups.length === 0) return '';
        return `Funktionelle Gruppen: ${this._joinList(groups)}.`;
    }

    _describeBonds() {
        let single = 0, double = 0, triple = 0, aromatic = 0;
        for (const edge of this.edges) {
            if (edge.bondType === '=') double++;
            else if (edge.bondType === '#') triple++;
            else if (edge.isPartOfAromaticRing) aromatic++;
            else single++;
        }

        const parts = [];
        if (double > 0) parts.push(`${double} Doppelbindung${double !== 1 ? 'en' : ''}`);
        if (triple > 0) parts.push(`${triple} Dreifachbindung${triple !== 1 ? 'en' : ''}`);
        if (aromatic > 0) parts.push(`${aromatic} aromatische Bindung${aromatic !== 1 ? 'en' : ''}`);

        if (parts.length === 0) return '';
        return `Bindungsverhältnisse: ${this._joinList(parts)}.`;
    }

    _describeStereo() {
        const stereoCenters = this.graph.vertices.filter(v => v.value.isStereoCenter);
        if (stereoCenters.length === 0) return '';
        return `${stereoCenters.length} chirales Zentrum erkannt.`;
    }

    _elementName(symbol) {
        const names = {
            'C': 'Kohlenstoffatom', 'H': 'Wasserstoffatom',
            'N': 'Stickstoffatom', 'O': 'Sauerstoffatom',
            'S': 'Schwefelatom', 'P': 'Phosphoratom',
            'F': 'Fluoratom', 'Cl': 'Chloratom',
            'Br': 'Bromatom', 'I': 'Iodatom',
            'B': 'Boratom', 'Si': 'Siliciumatom',
        };
        return names[symbol] || `${symbol}-Atom`;
    }

    _joinList(items) {
        if (items.length === 1) return items[0];
        return items.slice(0, -1).join(', ') + ' und ' + items[items.length - 1];
    }

    _hasGroup(signature, checkHetero = false) {
        // Vereinfachte Prüfung – echte Substruktur-Suche wäre ein separater Schritt
        if (checkHetero) {
            return this.graph.vertices.some(v => v.value.element === signature);
        }
        // Für komplexe Signaturen reicht ein simpler String-Vergleich im SMILES
        return this.smiles.includes(signature);
    }

    _countOHGroups() {
        let count = 0;
        for (const v of this.graph.vertices) {
            if (v.value.element === 'O') {
                const neighbours = v.neighbours.map(nid => this.graph.vertices[nid]);
                const hasH = neighbours.some(n => n.value.element === 'H');
                const hasC = neighbours.some(n => n.value.element === 'C');
                if ((hasH || neighbours.length === 1) && hasC) count++;
            }
        }
        return count;
    }

    _countNitrogenGroups() {
        let count = 0;
        for (const v of this.graph.vertices) {
            if (v.value.element === 'N' && v.neighbours.length > 1) {
                count++;
            }
        }
        return count;
    }

    _hasEther() {
        for (const v of this.graph.vertices) {
            if (v.value.element === 'O') {
                const neighbours = v.neighbours.map(nid => this.graph.vertices[nid]);
                const carbonCount = neighbours.filter(n => n.value.element === 'C').length;
                if (carbonCount >= 2) return true;
            }
        }
        return false;
    }
}
