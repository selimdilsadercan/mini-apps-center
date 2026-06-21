export interface GraphNode {
  id: string;
  name: string;
  type: "film" | "actor" | "director";
  color?: string;
  val?: number;
  imgUrl?: string;
  x?: number;
  y?: number;
  [key: string]: any; // Allow for other d3-force properties
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  role: "actor" | "director";
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
