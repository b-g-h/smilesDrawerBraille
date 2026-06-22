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

        return parts.filter(p => p).join('\n\n');
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
                return count === 1 ? `ein ${name}` : `${count} ${name}e`;
            });

        let text = `Das Molekül besteht aus insgesamt ${total} sichtbaren Atom${total !== 1 ? 'en' : ''}`;
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
            const isAromatic = ring.members.every(vid => this.graph.vertices[vid].value.isPartOfAromaticRing)
                || (ring.isBenzeneLike && ring.isBenzeneLike(this.graph.vertices));
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

        // Graph-basierte Erkennung funktioneller Gruppen
        const fg = this._detectFunctionalGroups();

        if (fg.carboxyl > 0) {
            groups.push(fg.carboxyl === 1 ? 'eine Carboxylgruppe' : `${fg.carboxyl} Carboxylgruppen`);
        }
        if (fg.ester > 0) {
            groups.push(fg.ester === 1 ? 'eine Estergruppe' : `${fg.ester} Estergruppen`);
        }
        if (fg.amide > 0) {
            groups.push(fg.amide === 1 ? 'eine Amidgruppe' : `${fg.amide} Amidgruppen`);
        }
        // Aldehyd nur wenn nicht schon Carboxyl/Ester/Amid gezählt
        if (fg.aldehyde > 0) {
            groups.push(fg.aldehyde === 1 ? 'eine Aldehydgruppe' : `${fg.aldehyde} Aldehydgruppen`);
        }
        // Keton nur wenn freies Carbonyl
        if (fg.ketone > 0) {
            groups.push(fg.ketone === 1 ? 'eine Ketogruppe' : `${fg.ketone} Ketogruppen`);
        }
        if (fg.hydroxyl > 0) {
            groups.push(fg.hydroxyl === 1 ? 'eine Hydroxylgruppe' : `${fg.hydroxyl} Hydroxylgruppen`);
        }
        if (fg.ether > 0) {
            groups.push(fg.ether === 1 ? 'eine Etherbindung' : `${fg.ether} Etherbindungen`);
        }
        if (fg.amine > 0) {
            groups.push(fg.amine === 1 ? 'eine Aminogruppe' : `${fg.amine} Aminogruppen`);
        }
        if (fg.nitro > 0) {
            groups.push(fg.nitro === 1 ? 'eine Nitrogruppe' : `${fg.nitro} Nitrogruppen`);
        }
        if (fg.nitrile > 0) {
            groups.push(fg.nitrile === 1 ? 'eine Nitrilgruppe' : `${fg.nitrile} Nitrilgruppen`);
        }
        if (fg.thiol > 0) {
            groups.push(fg.thiol === 1 ? 'eine Thiolgruppe' : `${fg.thiol} Thiolgruppen`);
        }
        if (fg.thioether > 0) {
            groups.push(fg.thioether === 1 ? 'eine Thioetherbindung' : `${fg.thioether} Thioetherbindungen`);
        }
        if (fg.halogen > 0) {
            const halogenList = [];
            if (fg.fluoride > 0) halogenList.push(`${fg.fluoride} Fluor`);
            if (fg.chloride > 0) halogenList.push(`${fg.chloride} Chlor`);
            if (fg.bromide > 0) halogenList.push(`${fg.bromide} Brom`);
            if (fg.iodide > 0) halogenList.push(`${fg.iodide} Iod`);
            groups.push(`Halogenatome: ${halogenList.join(', ')}`);
        }

        if (groups.length === 0) return '';
        return `Funktionelle Gruppen: ${this._joinList(groups)}.`;
    }

    /**
     * Graph-basierte Erkennung funktioneller Gruppen.
     * Gibt ein Objekt mit Zählern zurück.
     */
    _detectFunctionalGroups() {
        const fg = {
            carboxyl: 0, ester: 0, amide: 0,
            aldehyde: 0, ketone: 0,
            hydroxyl: 0, ether: 0,
            amine: 0, nitro: 0, nitrile: 0,
            thiol: 0, thioether: 0,
            halogen: 0, fluoride: 0, chloride: 0, bromide: 0, iodide: 0,
        };

        // Set für bereits zugeordnete Atome (um Doppelzählungen zu vermeiden)
        const usedCarbonylC = new Set();
        const usedHydroxylO = new Set();
        const usedEtherO = new Set();
        const usedAmineN = new Set();

        for (const v of this.graph.vertices) {
            const atom = v.value;
            const el = atom.element;
            const nbrs = this._getNeighbourVertices(v.id);

            // --- Carbonyl-Erkennung (C=O) ---
            if (el === 'C') {
                const doubleBondO = nbrs.find(n =>
                    n.value.element === 'O' && this._getEdge(v.id, n.id)?.bondType === '='
                );
                if (doubleBondO) {
                    // Prüfe die anderen Nachbarn des C (außer dem =O)
                    const otherNbrs = nbrs.filter(n => n.id !== doubleBondO.id);
                    const hasOH = otherNbrs.some(n =>
                        n.value.element === 'O' && this._getEdge(v.id, n.id)?.bondType === '-'
                    );
                    const hasOR = otherNbrs.some(n =>
                        n.value.element === 'O' && this._getEdge(v.id, n.id)?.bondType === '-' &&
                        this._getNeighbourVertices(n.id).filter(nn => nn.id !== v.id).length > 0
                    );
                    const hasNR = otherNbrs.some(n => n.value.element === 'N');
                    const hasH = otherNbrs.some(n => n.value.element === 'H');

                    // Priorisierung: Carboxyl > Ester > Amid > Aldehyd > Keton
                    if (hasOH) {
                        fg.carboxyl++;
                        usedCarbonylC.add(v.id);
                        // Markiere OH-Sauerstoff als verwendet
                        const ohO = otherNbrs.find(n =>
                            n.value.element === 'O' && this._getEdge(v.id, n.id)?.bondType === '-'
                        );
                        if (ohO) usedHydroxylO.add(ohO.id);
                    } else if (hasOR && !hasOH) {
                        fg.ester++;
                        usedCarbonylC.add(v.id);
                        // Markiere Alkoxy-Sauerstoff als verwendet
                        const orO = otherNbrs.find(n =>
                            n.value.element === 'O' && this._getEdge(v.id, n.id)?.bondType === '-'
                        );
                        if (orO) usedEtherO.add(orO.id);
                    } else if (hasNR) {
                        fg.amide++;
                        usedCarbonylC.add(v.id);
                    } else if (hasH) {
                        fg.aldehyde++;
                        usedCarbonylC.add(v.id);
                    } else {
                        fg.ketone++;
                        usedCarbonylC.add(v.id);
                    }
                }
            }

            // --- Nitril (C≡N) ---
            if (el === 'C') {
                const tripleN = nbrs.find(n =>
                    n.value.element === 'N' && this._getEdge(v.id, n.id)?.bondType === '#'
                );
                if (tripleN) {
                    fg.nitrile++;
                }
            }
        }

        // --- Hydroxyl (-OH an C) ---
        for (const v of this.graph.vertices) {
            if (usedHydroxylO.has(v.id)) continue;
            const atom = v.value;
            if (atom.element !== 'O') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            const hasH = nbrs.some(n => n.value.element === 'H');
            const hasC = nbrs.some(n => n.value.element === 'C');
            // Kein Carbonyl-C (d.h. kein Nachbar-C mit =O zu diesem O)
            const isCarbonylO = nbrs.some(n => {
                if (n.value.element !== 'C') return false;
                const edge = this._getEdge(v.id, n.id);
                return edge?.bondType === '=';
            });

            if (hasH && hasC && !isCarbonylO) {
                fg.hydroxyl++;
                usedHydroxylO.add(v.id);
            }
        }

        // --- Ether (R-O-R', nicht in Ester/Carboxyl) ---
        for (const v of this.graph.vertices) {
            if (usedEtherO.has(v.id)) continue;
            const atom = v.value;
            if (atom.element !== 'O') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            // Kein H, keine Carbonyl-Doppelbindung
            const hasH = nbrs.some(n => n.value.element === 'H');
            const isDoubleBonded = nbrs.some(n => {
                const edge = this._getEdge(v.id, n.id);
                return edge?.bondType === '=' || edge?.bondType === '#';
            });
            const carbonCount = nbrs.filter(n => n.value.element === 'C').length;

            if (!hasH && !isDoubleBonded && carbonCount >= 2) {
                fg.ether++;
                usedEtherO.add(v.id);
            }
        }

        // --- Amin (-NH2, -NHR, -NR2, nicht in Amid/Ring) ---
        for (const v of this.graph.vertices) {
            if (usedAmineN.has(v.id)) continue;
            const atom = v.value;
            if (atom.element !== 'N') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            // Keine Carbonyl-Doppelbindung (kein Amid)
            const isAmideN = nbrs.some(n => {
                if (n.value.element !== 'C') return false;
                const otherNbrsOfC = this._getNeighbourVertices(n.id).filter(nn => nn.id !== v.id);
                return otherNbrsOfC.some(nn => {
                    if (nn.value.element !== 'O') return false;
                    const edge = this._getEdge(n.id, nn.id);
                    return edge?.bondType === '=';
                });
            });

            const hasC = nbrs.some(n => n.value.element === 'C');
            if (hasC && !isAmideN) {
                fg.amine++;
                usedAmineN.add(v.id);
            }
        }

        // --- Nitro (-NO2) ---
        for (const v of this.graph.vertices) {
            const atom = v.value;
            if (atom.element !== 'N') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            const oCount = nbrs.filter(n => n.value.element === 'O').length;
            // Nitro hat typischerweise N mit 2 O-Nachbarn (eins =O, eins -O(-))
            if (oCount >= 2) {
                fg.nitro++;
            }
        }

        // --- Thiol (-SH) ---
        for (const v of this.graph.vertices) {
            const atom = v.value;
            if (atom.element !== 'S') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            const hasH = nbrs.some(n => n.value.element === 'H');
            const hasC = nbrs.some(n => n.value.element === 'C');
            if (hasH && hasC) {
                fg.thiol++;
            }
        }

        // --- Thioether (R-S-R') ---
        for (const v of this.graph.vertices) {
            const atom = v.value;
            if (atom.element !== 'S') continue;

            const nbrs = this._getNeighbourVertices(v.id);
            const hasH = nbrs.some(n => n.value.element === 'H');
            const carbonCount = nbrs.filter(n => n.value.element === 'C').length;
            if (!hasH && carbonCount >= 2) {
                fg.thioether++;
            }
        }

        // --- Halogenide ---
        for (const v of this.graph.vertices) {
            const el = v.value.element;
            const nbrs = this._getNeighbourVertices(v.id);
            const hasC = nbrs.some(n => n.value.element === 'C');
            if (hasC) {
                if (el === 'F') { fg.fluoride++; fg.halogen++; }
                else if (el === 'Cl') { fg.chloride++; fg.halogen++; }
                else if (el === 'Br') { fg.bromide++; fg.halogen++; }
                else if (el === 'I') { fg.iodide++; fg.halogen++; }
            }
        }

        return fg;
    }

    /**
     * Hilfsmethode: Gibt die Nachbar-Vertices eines Vertex zurück.
     */
    _getNeighbourVertices(vertexId) {
        const vertex = this.graph.vertices[vertexId];
        return vertex.neighbours.map(nid => this.graph.vertices[nid]);
    }

    /**
     * Hilfsmethode: Gibt die Kante zwischen zwei Vertices zurück.
     */
    _getEdge(vertexIdA, vertexIdB) {
        return this.graph.getEdge(vertexIdA, vertexIdB);
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
}
