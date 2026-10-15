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
    constructor(graph: Graph, rings: Ring[], edges: Edge[], smiles: string);
    graph: Graph;
    rings: Ring[];
    edges: Edge[];
    smiles: string;
    /**
     * Hauptmethode – liefert einen deutschen Beschreibungstext.
     * @returns {String}
     */
    generate(): string;
    _describeComposition(): string;
    _describeRings(): string;
    _describeFunctionalGroups(): string;
    /**
     * Graph-basierte Erkennung funktioneller Gruppen.
     * Gibt ein Objekt mit Zählern zurück.
     */
    _detectFunctionalGroups(): {
        carboxyl: number;
        ester: number;
        amide: number;
        aldehyde: number;
        ketone: number;
        hydroxyl: number;
        ether: number;
        amine: number;
        nitro: number;
        nitrile: number;
        thiol: number;
        thioether: number;
        halogen: number;
        fluoride: number;
        chloride: number;
        bromide: number;
        iodide: number;
    };
    /**
     * Hilfsmethode: Gibt die Nachbar-Vertices eines Vertex zurück.
     */
    _getNeighbourVertices(vertexId: any): any;
    /**
     * Hilfsmethode: Gibt die Kante zwischen zwei Vertices zurück.
     */
    _getEdge(vertexIdA: any, vertexIdB: any): any;
    _describeBonds(): string;
    _describeStereo(): string;
    _elementName(symbol: any): any;
    _joinList(items: any): any;
}
