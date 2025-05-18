// Speculative Fiction & Philosophy MCP Extension for LaTeX
// This extends the LaTeX MCP Server with specialized tools for creative and philosophical writing

import {
  MCPServer,
  ToolDefinition,
  ExecuteToolRequestSchema,
  ExecuteToolResponseSchema,
} from '@anthropic-ai/mcp-typescript-sdk';
import { Claude } from '@anthropic/sdk';

import { WORLDBUILDING_TOOL, handleWorldbuildingDocument } from "./worldbuilding";
import { CHARACTER_DEVELOPMENT_TOOL, handleCharacterProfile } from "./character";
import { PHILOSOPHICAL_CITATION_TOOL, handlePhilosophicalCitation } from "./citation";
// Initialize Claude client for advanced generation capabilities
const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY
});


/**
 * Philosophical Argument Structure Tool
 * Creates LaTeX structures for philosophical arguments and thought experiments
 */
const PHILOSOPHICAL_ARGUMENT_TOOL: ToolDefinition = {
  name: 'create-philosophical-argument',
  description: 'Creates LaTeX structures for philosophical arguments and thought experiments',
  parameters: {
    type: 'object',
    properties: {
      argumentType: {
        type: 'string',
        enum: ['deductive', 'inductive', 'abductive', 'analogical', 'transcendental', 'thought-experiment', 'dialectical'],
        description: 'Type of philosophical argument',
      },
      title: {
        type: 'string',
        description: 'Title of the argument or thought experiment',
      },
      premise: {
        type: 'string',
        description: 'Starting premise or situation',
      },
      tradition: {
        type: 'string',
        enum: ['analytic', 'continental', 'eastern', 'existentialist', 'phenomenological', 'pragmatist', 'other'],
        description: 'Philosophical tradition or approach',
        default: 'analytic',
      },
      includeCounterarguments: {
        type: 'boolean',
        description: 'Whether to include sections for potential counterarguments',
        default: true,
      },
    },
    required: ['title', 'premise'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the philosophical argument structure',
      },
      argumentStructure: {
        type: 'object',
        description: 'Structure of the generated argument',
      },
    },
  },
};

/**
};

/**
 * Concept Map Tool
 * Creates LaTeX visualizations of philosophical concepts and their relationships
 */
const CONCEPT_MAP_TOOL: ToolDefinition = {
  name: 'create-concept-map',
  description: 'Creates LaTeX diagrams visualizing philosophical concepts and their relationships',
  parameters: {
    type: 'object',
    properties: {
      centralConcept: {
        type: 'string',
        description: 'The central philosophical concept',
      },
      relatedConcepts: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Related philosophical concepts',
      },
      relationships: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['supports', 'contradicts', 'derives_from', 'influences', 'precedes', 'defines']
            },
            description: { type: 'string' }
          }
        },
        description: 'Relationships between concepts',
      },
      diagramType: {
        type: 'string',
        enum: ['tikz-mindmap', 'tikz-flowchart', 'forest', 'graphviz-dot'],
        description: 'LaTeX package to use for diagram',
        default: 'tikz-mindmap',
      },
    },
    required: ['centralConcept', 'relatedConcepts'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the concept map',
      },
      packageRequirements: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Required LaTeX packages for the diagram',
      },
    },
  },
};

/**
 * Dialogue Formatting Tool
 * Creates properly formatted dialogue in LaTeX for speculative fiction
 */
const DIALOGUE_FORMATTING_TOOL: ToolDefinition = {
  name: 'format-dialogue',
  description: 'Creates properly formatted dialogue in LaTeX for speculative fiction',
  parameters: {
    type: 'object',
    properties: {
      dialogueText: {
        type: 'string',
        description: 'Raw dialogue text to format (can include speaker indications)',
      },
      style: {
        type: 'string',
        enum: ['novel', 'script', 'play', 'informal'],
        description: 'Style of dialogue formatting',
        default: 'novel',
      },
      includeThoughtText: {
        type: 'boolean',
        description: 'Whether internal thoughts should be formatted differently',
        default: true,
      },
      speciesSpecificFormatting: {
        type: 'boolean',
        description: 'Apply special formatting for non-human speakers',
        default: false,
      },
    },
    required: ['dialogueText'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the formatted dialogue',
      },
      speakers: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of speakers detected in the dialogue',
      },
    },
  },
};

/**
 * Timeline Visualization Tool
 * Creates LaTeX code for visualizing speculative fiction timelines
 */
const TIMELINE_TOOL: ToolDefinition = {
  name: 'create-timeline',
  description: 'Creates LaTeX code for visualizing speculative fiction timelines',
  parameters: {
    type: 'object',
    properties: {
      timelineTitle: {
        type: 'string',
        description: 'Title of the timeline',
      },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            description: { type: 'string' },
            importance: { 
              type: 'string',
              enum: ['major', 'minor', 'background'],
              default: 'major'
            }
          }
        },
        description: 'Events to include in the timeline',
      },
      timelineType: {
        type: 'string',
        enum: ['linear', 'branching', 'parallel', 'circular'],
        description: 'Type of timeline structure',
        default: 'linear',
      },
      timeUnit: {
        type: 'string',
        description: 'Unit of time measurement (e.g., "CE/BCE", "cycles", "iterations")',
        default: 'years',
      },
    },
    required: ['timelineTitle', 'events'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the timeline',
      },
      packageRequirements: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Required LaTeX packages for the timeline',
      },
    },
  },
};

/**
 * Handles worldbuilding document creation
 */

/**
 * Handles philosophical argument structure creation
 */
async function handlePhilosophicalArgument(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { 
    argumentType = 'deductive', 
    title, 
    premise, 
    tradition = 'analytic',
    includeCounterarguments = true
  } = parameters;
  
  // Create appropriate structure based on argument type
  let argumentStructure: Record<string, any> = {
    title,
    type: argumentType,
    tradition,
    sections: []
  };
  
  // Build different structures based on argument type
  if (argumentType === 'deductive') {
    argumentStructure.sections = [
      'Premises',
      'Logical Structure',
      'Conclusion',
      'Implications'
    ];
    if (includeCounterarguments) {
      argumentStructure.sections.push('Potential Objections', 'Responses to Objections');
    }
  } else if (argumentType === 'thought-experiment') {
    argumentStructure.sections = [
      'Scenario Description',
      'Intuition Pump',
      'Philosophical Implications',
      'Related Thought Experiments'
    ];
    if (includeCounterarguments) {
      argumentStructure.sections.push('Alternative Interpretations', 'Critiques');
    }
  } else if (argumentType === 'dialectical') {
    argumentStructure.sections = [
      'Thesis',
      'Antithesis',
      'Synthesis',
      'Historical Context'
    ];
  } else {
    // Default structure for other argument types
    argumentStructure.sections = [
      'Background',
      'Main Argument',
      'Supporting Evidence',
      'Conclusion',
      'Implications'
    ];
    if (includeCounterarguments) {
      argumentStructure.sections.push('Counterarguments', 'Responses');
    }
  }
  
  // Generate LaTeX code based on the argument structure
  let latex = `\\documentclass[12pt]{article}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\usepackage{hyperref}
\\usepackage{ulem}

% Philosophical Argument Style
\\geometry{margin=1in}
\\hypersetup{colorlinks=true, linkcolor=blue, filecolor=magenta, urlcolor=cyan}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{\\textit{${title}}}
\\lhead{\\textit{${tradition} Philosophy - ${argumentType} argument}}
\\cfoot{\\thepage}

\\titleformat{\\section}{\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\normalfont\\large\\bfseries}{\\thesubsection}{1em}{}

\\begin{document}

\\begin{center}
{\\LARGE\\bfseries ${title}}\\\\[0.5cm]
{\\large A ${argumentType} argument in the ${tradition} tradition}\\\\[1cm]
\\end{center}

`;

  // Add initial premise/abstract
  latex += `\\begin{abstract}
${premise}
\\end{abstract}

\\tableofcontents
\\newpage

`;

  // Add sections based on argument type
  argumentStructure.sections.forEach(section => {
    latex += `\\section{${section}}\n`;
    
    // Add specific content based on section type
    if (section === 'Logical Structure' && argumentType === 'deductive') {
      latex += `% Formal logical structure of the argument
\\begin{align}
P_1 &: \\text{First premise} \\\\
P_2 &: \\text{Second premise} \\\\
\\therefore C &: \\text{Conclusion}
\\end{align}

`;
    } else if (section === 'Premises' && argumentType === 'deductive') {
      latex += `\\begin{enumerate}[label=P\\arabic*.]
\\item First premise statement
\\item Second premise statement
\\item Third premise statement
\\end{enumerate}

`;
    } else if (section === 'Thesis' && argumentType === 'dialectical') {
      latex += `\\subsection{Main Position}
Articulate the initial position here.

\\subsection{Supporting Arguments}
Provide arguments that support this position.

`;
    } else if (section === 'Antithesis' && argumentType === 'dialectical') {
      latex += `\\subsection{Opposing Position}
Articulate the opposing position.

\\subsection{Critique of Thesis}
Detail how this position contradicts or undermines the thesis.

`;
    } else if (section === 'Intuition Pump' && argumentType === 'thought-experiment') {
      latex += `\\begin{center}
\\fbox{\\begin{minipage}{0.8\\textwidth}
\\textbf{Central Question:} What key question does this thought experiment ask the reader to consider?
\\end{minipage}}
\\end{center}

`;
    } else {
      // Default section content
      latex += `% Content for ${section}\n\n`;
    }
  });
  
  // Add bibliography section
  latex += `\\section{References}
\\begin{thebibliography}{9}
\\bibitem{key} Author, A. (Year). \\textit{Title of work}. Location: Publisher.
\\end{thebibliography}

\\end{document}`;

  return {
    result: {
      latex,
      argumentStructure,
    }
  };
}

/**
 * Handles character profile creation
 */

/**
 * Handles concept map creation
 */
async function handleConceptMap(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { 
    centralConcept, 
    relatedConcepts = [],
    relationships = [],
    diagramType = 'tikz-mindmap'
  } = parameters;
  
  // Define required packages based on diagram type
  let packageRequirements: string[] = [];
  let diagramLatex = '';
  
  if (diagramType === 'tikz-mindmap') {
    packageRequirements = ['tikz', 'mindmap'];
    
    // Create TikZ mindmap
    diagramLatex = `\\begin{tikzpicture}[mindmap, concept color=blue!40,
  every node/.style={concept, execute at begin node=\\hspace{2pt}},
  root concept/.append style={concept color=blue!50, line width=1ex, text=white},
  level 1 concept/.append style={level distance=5cm, sibling angle=90, concept color=orange!40},
  level 2 concept/.append style={level distance=3cm, sibling angle=45, concept color=green!40}]

\\node[root concept] {${centralConcept}}
  child[grow=0] { node[concept] {${relatedConcepts[0] || 'Concept 1'}} }
  child[grow=90] { node[concept] {${relatedConcepts[1] || 'Concept 2'}} }
  child[grow=180] { node[concept] {${relatedConcepts[2] || 'Concept 3'}} }
  child[grow=270] { node[concept] {${relatedConcepts[3] || 'Concept 4'}} };
\\end{tikzpicture}`;
    
  } else if (diagramType === 'tikz-flowchart') {
    packageRequirements = ['tikz', 'shapes.geometric', 'arrows.meta', 'positioning'];
    
    // Create TikZ flowchart
    diagramLatex = `\\begin{tikzpicture}[
  concept/.style={rectangle, rounded corners, draw=blue!50, fill=blue!10, thick, minimum width=3cm, minimum height=1cm},
  arrow/.style={->, >=Stealth, thick}]

\\node[concept] (central) at (0,0) {${centralConcept}};
`;

    // Add related concepts
    const positions = [
      [3, 1], [-3, 1], [3, -1], [-3, -1]
    ];
    
    for (let i = 0; i < Math.min(relatedConcepts.length, positions.length); i++) {
      const [x, y] = positions[i];
      diagramLatex += `\\node[concept] (concept${i+1}) at (${x}, ${y}) {${relatedConcepts[i]}};
`;
    }
    
    // Add relationships as arrows
    for (let i = 0; i < Math.min(relatedConcepts.length, positions.length); i++) {
      diagramLatex += `\\draw[arrow] (central) -- (concept${i+1}) node[midway, fill=white, font=\\small] {relationship};
`;
    }
    
    diagramLatex += `\\end{tikzpicture}`;
    
  } else if (diagramType === 'forest') {
    packageRequirements = ['forest'];
    
    // Create forest tree diagram
    diagramLatex = `\\begin{forest}
  for tree={
    draw,
    rounded corners,
    fill=blue!10,
    minimum width=2.5cm,
    minimum height=0.8cm,
    text centered,
    font=\\sffamily,
    grow=0
  }
  [${centralConcept}
`;

    // Add related concepts as child nodes
    for (const concept of relatedConcepts) {
      diagramLatex += `    [${concept}]\n`;
    }
    
    diagramLatex += `  ]
\\end{forest}`;
    
  } else { // graphviz-dot
    packageRequirements = ['graphviz'];
    
    // Create Graphviz/dot diagram
    diagramLatex = `\\begin{dot2tex}[mathmode, styleonly]
digraph G {
  node [shape=box, style="rounded,filled", fillcolor=lightblue];
  "${centralConcept}";
`;

    // Add related concepts
    for (const concept of relatedConcepts) {
      diagramLatex += `  "${concept}";\n`;
    }
    
    // Add relationships
    for (let i = 0; i < relatedConcepts.length; i++) {
      diagramLatex += `  "${centralConcept}" -> "${relatedConcepts[i]}" [label="relation"];\n`;
    }
    
    diagramLatex += `}
\\end{dot2tex}`;
  }
  
  // Create full LaTeX document
  const latex = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{xcolor}
${packageRequirements.map(pkg => `\\usepackage{${pkg}}`).join('\n')}

\\title{Philosophical Concept Map: ${centralConcept}}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{Concept Map: ${centralConcept}}

\\begin{center}
${diagramLatex}
\\end{center}

\\section{Concept Definitions}

\\subsection{${centralConcept}}
Definition of the central concept.

${relatedConcepts.map(concept => `\\subsection{${concept}}\nDefinition of ${concept}.`).join('\n\n')}

\\section{Relationships}

${relationships.length > 0 ? 
  relationships.map(rel => 
    `\\subsection{${rel.from} ${rel.type.replace('_', ' ')} ${rel.to}}\n${rel.description || 'Description of relationship.'}`
  ).join('\n\n') : 
  '% Add relationship descriptions here'}

\\end{document}`;

  return {
    result: {
      latex,
      packageRequirements,
    }
  };
}

/**
 * Handles dialogue formatting
 */
async function handleDialogueFormatting(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { 
    dialogueText, 
    style = 'novel', 
    includeThoughtText = true,
    speciesSpecificFormatting = false
  } = parameters;
  
  // Parse the dialogue to identify speakers and structure
  const lines = dialogueText.split(/\n+/);
  const speakers: string[] = [];
  let formattedLatex = '';
  
  // Define LaTeX styles based on dialogue style
  let preamble = '';
  
  if (style === 'novel') {
    preamble = `% Novel-style dialogue formatting
\\newcommand{\\dialogue}[2]{``#2'' said #1.}
\\newcommand{\\dialoguecontinued}[1]{``#1''}
${includeThoughtText ? '\\newcommand{\\thoughttext}[2]{\\textit{#1 thought, #2}}' : ''}
${speciesSpecificFormatting ? '\\newcommand{\\alienvoice}[2]{\\textsl{``#2''} hissed #1.}' : ''}
`;
  } else if (style === 'script') {
    preamble = `% Script-style dialogue formatting
\\newcommand{\\character}[1]{\\textbf{#1}}
\\newcommand{\\dialogue}[2]{\\character{#1}\\\\#2\\\\}
\\newcommand{\\action}[1]{\\textit{(#1)}}
${includeThoughtText ? '\\newcommand{\\voiceover}[2]{\\character{#1} (V.O.)\\\\#2\\\\}' : ''}
`;
  } else if (style === 'play') {
    preamble = `% Play-style dialogue formatting
\\newcommand{\\character}[1]{\\textsc{#1}}
\\newcommand{\\dialogue}[2]{\\character{#1.} #2}
\\newcommand{\\stagedirection}[1]{\\textit{[#1]}}
${includeThoughtText ? '\\newcommand{\\aside}[2]{\\character{#1} [\\textit{Aside}] #2}' : ''}
`;
  } else { // informal
    preamble = `% Informal dialogue formatting
\\newcommand{\\speaker}[1]{\\textbf{#1:}}
\\newcommand{\\dialogue}[2]{\\speaker{#1} #2}
${includeThoughtText ? '\\newcommand{\\thoughtbubble}[2]{\\textit{[#1 thinks: #2]}}' : ''}
`;
  }
  
  // Format the dialogue based on style
  if (style === 'novel') {
    // Process dialogue for novel format
    for (const line of lines) {
      // Extract speaker if in format "Speaker: Dialogue"
      const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
      
      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        if (!speakers.includes(speaker)) {
          speakers.push(speaker);
        }
        
        // Check if this is thought text
        if (includeThoughtText && (text.startsWith('*') && text.endsWith('*'))) {
          const thought = text.replace(/^\*|\*$/g, '');
          formattedLatex += `\\thoughttext{${speaker}}{${thought}}\n\n`;
        } 
        // Check if this is alien/non-human speech
        else if (speciesSpecificFormatting && speaker.match(/alien|non-human|creature|monster/i)) {
          formattedLatex += `\\alienvoice{${speaker}}{${text}}\n\n`;
        }
        // Regular dialogue
        else {
          formattedLatex += `\\dialogue{${speaker}}{${text}}\n\n`;
        }
      } 
      // Dialogue continuation (no speaker indicated)
      else if (line.trim().startsWith('"') || line.trim().startsWith('\'')) {
        formattedLatex += `\\dialoguecontinued{${line.trim()}}\n\n`;
      }
      // Regular narration
      else if (line.trim()) {
        formattedLatex += `${line.trim()}\n\n`;
      }
    }
  } else if (style === 'script') {
    // Process dialogue for script format
    for (const line of lines) {
      // Extract speaker if in format "Speaker: Dialogue"
      const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
      
      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        if (!speakers.includes(speaker)) {
          speakers.push(speaker);
        }
        
        // Check if this is a voice over
        if (includeThoughtText && (text.startsWith('(V.O.)') || text.startsWith('(VOICE OVER)'))) {
          const voiceOverText = text.replace(/^\(V\.O\.\)|\(VOICE OVER\)\s*/i, '').trim();
          formattedLatex += `\\voiceover{${speaker}}{${voiceOverText}}\n\n`;
        }
        // Regular dialogue
        else {
          formattedLatex += `\\dialogue{${speaker}}{${text}}\n\n`;
        }
      }
      // Action/direction in parentheses
      else if (line.trim().match(/^\(.*\)$/)) {
        formattedLatex += `\\action{${line.trim().replace(/^\(|\)$/g, '')}}\n\n`;
      }
      // Scene heading (ALL CAPS)
      else if (line.trim().match(/^[A-Z\s.]+$/)) {
        formattedLatex += `\\textbf{${line.trim()}}\n\n`;
      }
      // Regular action description
      else if (line.trim()) {
        formattedLatex += `${line.trim()}\n\n`;
      }
    }
  } else if (style === 'play') {
    // Process dialogue for play format
    for (const line of lines) {
      // Extract speaker if in format "Speaker: Dialogue"
      const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
      
      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        if (!speakers.includes(speaker)) {
          speakers.push(speaker);
        }
        
        // Check if this is an aside
        if (includeThoughtText && (text.startsWith('[Aside]') || text.startsWith('[aside]'))) {
          const asideText = text.replace(/^\[Aside\]|\[aside\]\s*/i, '').trim();
          formattedLatex += `\\aside{${speaker}}{${asideText}}\n\n`;
        }
        // Regular dialogue
        else {
          formattedLatex += `\\dialogue{${speaker}}{${text}}\n\n`;
        }
      }
      // Stage direction in brackets
      else if (line.trim().match(/^\[.*\]$/)) {
        formattedLatex += `\\stagedirection{${line.trim().replace(/^\[|\]$/g, '')}}\n\n`;
      }
      // Scene heading
      else if (line.trim().match(/^Act|Scene|Setting/i)) {
        formattedLatex += `\\textbf{${line.trim()}}\n\n`;
      }
      // Regular narration or description
      else if (line.trim()) {
        formattedLatex += `${line.trim()}\n\n`;
      }
    }
  } else { // informal
    // Process dialogue for informal format
    for (const line of lines) {
      // Extract speaker if in format "Speaker: Dialogue"
      const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
      
      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        if (!speakers.includes(speaker)) {
          speakers.push(speaker);
        }
        
        // Check if this is thought text
        if (includeThoughtText && (text.startsWith('(thinks:') || text.startsWith('[thinks:'))) {
          const thoughtMatch = text.match(/^\(thinks:|^\[thinks:(.+?)(\)|\])$/);
          if (thoughtMatch) {
            const thought = thoughtMatch[1].trim();
            formattedLatex += `\\thoughtbubble{${speaker}}{${thought}}\n\n`;
          } else {
            formattedLatex += `\\dialogue{${speaker}}{${text}}\n\n`;
          }
        }
        // Regular dialogue
        else {
          formattedLatex += `\\dialogue{${speaker}}{${text}}\n\n`;
        }
      }
      // System message or narration
      else if (line.trim()) {
        formattedLatex += `\\textit{${line.trim()}}\n\n`;
      }
    }
  }
  
  // Create complete LaTeX document
  const fullLatex = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{fontspec}  % For more font options
\\usepackage{lettrine}  % For drop caps
\\usepackage{dialogue}  % For dialogue formatting

% Custom dialogue formatting
${preamble}

\\begin{document}

\\section*{Dialogue}

${formattedLatex}

\\end{document}`;

  return {
    result: {
      latex: fullLatex,
      speakers
    }
  };
}

/**
 * Handles timeline creation
 */
async function handleTimelineCreation(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { 
    timelineTitle, 
    events = [],
    timelineType = 'linear',
    timeUnit = 'years'
  } = parameters;
  
  // Determine required packages based on timeline type
  let packageRequirements = ['tikz', 'xcolor'];
  
  if (timelineType === 'branching' || timelineType === 'parallel') {
    packageRequirements.push('forest');
  }
  
  if (timelineType === 'circular') {
    packageRequirements.push('pgfplots');
  }
  
  // Generate appropriate LaTeX code for the timeline
  let timelineLatex = '';
  
  if (timelineType === 'linear') {
    // Create linear timeline with TikZ
    timelineLatex = `\\begin{tikzpicture}[
  timeline/.style={
    draw=blue!50,
    ultra thick,
    line cap=round,
  },
  event/.style={
    draw=orange!50,
    fill=orange!20,
    rounded corners,
    text width=4cm,
    minimum height=1cm,
    align=center,
    font=\\small
  },
  major event/.style={
    event,
    fill=red!20
  },
  minor event/.style={
    event,
    fill=blue!10,
    text width=3cm
  },
  background event/.style={
    event,
    fill=gray!10,
    text width=2.5cm
  },
  timepoint/.style={
    circle,
    draw=blue!50,
    fill=white,
    inner sep=2pt
  }
]

% Draw the timeline
\\draw[timeline] (0,0) -- (10,0);

% Add events
`;

    // Determine positions for events on the timeline
    if (events.length > 0) {
      const positions = Array.from({ length: events.length }, (_, i) => 
        10 * i / (events.length - 1 || 1)
      );
      
      events.forEach((event, index) => {
        const xPos = positions[index];
        const yPos = index % 2 === 0 ? 1 : -1;
        const style = event.importance === 'major' ? 'major event' : 
                      event.importance === 'minor' ? 'minor event' : 
                      'background event';
        
        timelineLatex += `\\node[timepoint] at (${xPos},0) {};
\\node[${style}] at (${xPos},${yPos}) {${event.date}\\\\${event.description}};
`;
      });
    } else {
      // Example events if none provided
      timelineLatex += `\\node[timepoint] at (0,0) {};
\\node[major event] at (0,1) {Start Date\\\\Beginning of timeline};

\\node[timepoint] at (5,0) {};
\\node[event] at (5,-1) {Middle Date\\\\Important middle event};

\\node[timepoint] at (10,0) {};
\\node[major event] at (10,1) {End Date\\\\Conclusion of timeline};
`;
    }
    
    timelineLatex += `\\end{tikzpicture}`;
    
  } else if (timelineType === 'branching') {
    // Create branching timeline using forest package
    timelineLatex = `\\begin{forest}
  for tree={
    grow=east,
    edge={draw, thick, ->},
    edge path={\\noexpand\\path [\\forestoption{edge}] (!u.parent anchor) -- +(10pt,0) |- (.child anchor)\\forestoption{edge label};},
    parent anchor=east,
    child anchor=west,
    l sep=10mm,
    fork sep=3mm,
    tier/.wrap pgfmath arg={tier #1}{level()},
    edge label={font=\\scriptsize,fill=white,inner sep=1pt},
    if level=0{draw,fill=blue!20,rounded corners}{
      if n=1{draw,fill=green!20,rounded corners}{
        if n=2{draw,fill=red!20,rounded corners}{
          draw,fill=gray!10,rounded corners
        }
      }
    },
    minimum width=3cm,
    minimum height=1cm,
    align=center,
  }
  [Origin Point
`;

    // Add branching events using forest syntax
    if (events.length > 0) {
      // Simplified branching - in a real implementation, we'd parse the event relationships
      let currentLevel = 0;
      let lastEvent = null;
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        if (i === 0) {
          // First event replaces the "Origin Point"
          timelineLatex = timelineLatex.replace('Origin Point', `${event.date}\\\\${event.description}`);
          lastEvent = event;
        } else if (i === 1) {
          // First branch
          timelineLatex += `    [${event.date}\\\\${event.description}
`;
          currentLevel++;
          lastEvent = event;
        } else if (i === 2) {
          // Second branch from root
          const indentation = '    '.repeat(currentLevel);
          timelineLatex += `${indentation}]
    [${event.date}\\\\${event.description}
`;
          lastEvent = event;
        } else {
          // Additional events as sub-branches
          const indentation = '    '.repeat(currentLevel + 1);
          timelineLatex += `${indentation}[${event.date}\\\\${event.description}]
`;
        }
      }
      
      // Close any open brackets
      for (let i = 0; i <= currentLevel; i++) {
        const indentation = '    '.repeat(currentLevel - i);
        timelineLatex += `${indentation}]
`;
      }
    } else {
      // Example branching timeline if no events provided
      timelineLatex += `    [Event 1\\\\First major development
        [Event 1.1\\\\Sub-development]
        [Event 1.2\\\\Alternative path]
    ]
    [Event 2\\\\Second major development
        [Event 2.1\\\\Consequences]
    ]
  ]`;
    }
    
    timelineLatex += `\\end{forest}`;
    
  } else if (timelineType === 'parallel') {
    // Create parallel timeline for showing multiple concurrent storylines
    timelineLatex = `% Parallel timeline with multiple tracks
\\begin{tikzpicture}[
  timeline/.style={
    draw=blue!50,
    ultra thick,
  },
  event/.style={
    draw=orange!50,
    fill=orange!20,
    rounded corners,
    text width=3cm,
    minimum height=0.8cm,
    align=center,
    font=\\small
  }
]

% Define timeline tracks
\\draw[timeline] (0,0) -- (12,0) node[right] {Track A};
\\draw[timeline] (0,-3) -- (12,-3) node[right] {Track B};
\\draw[timeline] (0,-6) -- (12,-6) node[right] {Track C};

% Add vertical time markers
\\foreach \\x in {0,3,6,9,12} {
    \\draw[dashed] (\\x,1) -- (\\x,-7);
    \\node[above] at (\\x,1) {Time \\x};
}

% Add events on different tracks
`;

    // Add events to appropriate tracks
    if (events.length > 0) {
      const trackMap = { 'A': 0, 'B': -3, 'C': -6 };
      
      for (const event of events) {
        // Extract track from description or use default
        const trackMatch = event.description.match(/Track ([ABC])/i);
        const track = trackMatch ? trackMatch[1].toUpperCase() : 'A';
        const yPos = trackMap[track] || 0;
        
        // Convert date to position (simple implementation)
        const dateNum = parseInt(event.date) || 0;
        const xPos = Math.min(Math.max(dateNum, 0), 12);
        
        timelineLatex += `\\node[event] at (${xPos},${yPos}) {${event.date}\\\\${event.description.replace(/Track [ABC]/i, '')}};
`;
      }
    } else {
      // Example events if none provided
      timelineLatex += `\\node[event] at (2,0) {Year 1\\\\Event on Track A};
\\node[event] at (5,0) {Year 4\\\\Another event on Track A};
\\node[event] at (3,-3) {Year 2\\\\Event on Track B};
\\node[event] at (8,-3) {Year 7\\\\Another event on Track B};
\\node[event] at (4,-6) {Year 3\\\\Event on Track C};
\\node[event] at (10,-6) {Year 9\\\\Another event on Track C};
`;
    }
    
    // Add connecting lines between related events
    timelineLatex += `
% Connections between related events
\\draw[->, red, thick] (2.5,0) to[out=270, in=90] (3.5,-3);
\\draw[->, red, thick] (3.5,-3) to[out=270, in=90] (4.5,-6);

\\end{tikzpicture}`;
    
  } else { // circular
    // Create circular timeline
    timelineLatex = `% Circular timeline
\\begin{tikzpicture}
\\def\\radius{5cm}

% Draw the circular timeline
\\draw[thick, blue!50] (0,0) circle (\\radius);

% Add time periods around the circle
\\foreach \\angle [count=\\i] in {0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330} {
    \\draw[thick] (\\angle:\\radius) -- (\\angle:\\radius+0.2);
    \\node at (\\angle:\\radius+0.5) {Period \\i};
}

% Add events around the circle
`;

    // Add events around the circle
    if (events.length > 0) {
      const totalAngle = 360;
      const angleStep = totalAngle / events.length;
      
      events.forEach((event, index) => {
        const angle = index * angleStep;
        const eventRadius = event.importance === 'major' ? '\\radius+1.5' : 
                           event.importance === 'minor' ? '\\radius+1.0' : 
                           '\\radius+0.8';
        const color = event.importance === 'major' ? 'red!20' : 
                     event.importance === 'minor' ? 'orange!20' : 
                     'blue!10';
        
        timelineLatex += `\\node[draw, fill=${color}, rounded corners, text width=2.5cm, align=center] at (${angle}:${eventRadius}) {${event.date}\\\\${event.description}};
\\draw[->] (${angle}:\\radius+0.2) -- (${angle}:${eventRadius}-0.6);
`;
      });
    } else {
      // Example events if none provided
      timelineLatex += `\\node[draw, fill=red!20, rounded corners, text width=2.5cm, align=center] at (0:\\radius+1.5) {Event 1\\\\Major event};
\\draw[->] (0:\\radius+0.2) -- (0:\\radius+0.9);

\\node[draw, fill=orange!20, rounded corners, text width=2.5cm, align=center] at (90:\\radius+1.5) {Event 2\\\\Important event};
\\draw[->] (90:\\radius+0.2) -- (90:\\radius+0.9);

\\node[draw, fill=blue!10, rounded corners, text width=2.5cm, align=center] at (180:\\radius+1.5) {Event 3\\\\Another event};
\\draw[->] (180:\\radius+0.2) -- (180:\\radius+0.9);

\\node[draw, fill=orange!20, rounded corners, text width=2.5cm, align=center] at (270:\\radius+1.5) {Event 4\\\\Final event};
\\draw[->] (270:\\radius+0.2) -- (270:\\radius+0.9);
`;
    }
    
    timelineLatex += `
% Add a central title
\\node[draw, fill=blue!20, text width=3cm, align=center, rounded corners] at (0,0) {${timelineTitle}};

\\end{tikzpicture}`;
  }
  
  // Create complete LaTeX document
  const fullLatex = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{tikz}
\\usepackage{xcolor}
${packageRequirements.filter(pkg => pkg !== 'tikz' && pkg !== 'xcolor').map(pkg => `\\usepackage{${pkg}}`).join('\n')}

\\title{${timelineTitle}}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{Timeline of Events}

\\begin{center}
${timelineLatex}
\\end{center}

\\section{Event Details}

\\begin{description}
${events.length > 0 ? 
  events.map(event => `\\item[${event.date}] ${event.description}`).join('\n') : 
  '\\item[Event Date] Description of the event.'}
\\end{description}

\\end{document}`;

  return {
    result: {
      latex: fullLatex,
      packageRequirements
    }
  };
}

/**
 * Handles philosophical citation formatting
 */

// Register implementation for each tool
async function registerToolImplementations(server: MCPServer): Promise<void> {
  server.setRequestHandler(ExecuteToolRequestSchema, async (request) => {
    const { tool, parameters } = request;
    
    switch (tool) {
      case 'create-worldbuilding-document':
        return handleWorldbuildingDocument(parameters);
      case 'create-philosophical-argument':
        return handlePhilosophicalArgument(parameters);
      case 'create-character-profile':
        return handleCharacterProfile(parameters);
      case 'create-concept-map':
        return handleConceptMap(parameters);
      case 'format-dialogue':
        return handleDialogueFormatting(parameters);
      case 'create-timeline':
        return handleTimelineCreation(parameters);
      case 'format-philosophical-citation':
        return handlePhilosophicalCitation(parameters);
      default:
        throw new Error(`Unsupported tool: ${tool}`);
    }
  });
}

/**
 * Main function to configure and start the Speculative Fiction & Philosophy MCP extension
 */
export async function configureSpeculativePhilosophyExtension(server: MCPServer): Promise<void> {
  // Register all tools with the server
  server.addTool(WORLDBUILDING_TOOL);
  server.addTool(PHILOSOPHICAL_ARGUMENT_TOOL);
  server.addTool(CHARACTER_DEVELOPMENT_TOOL);
  server.addTool(CONCEPT_MAP_TOOL);
  server.addTool(DIALOGUE_FORMATTING_TOOL);
  server.addTool(TIMELINE_TOOL);
  server.addTool(PHILOSOPHICAL_CITATION_TOOL);
  
  // Register implementation handlers
  await registerToolImplementations(server);
  
  console.log('Speculative Fiction & Philosophy MCP Extension loaded!');
}

// If this module is being run directly
if (require.main === module) {
  const server = new MCPServer();
  
  configureSpeculativePhilosophyExtension(server)
    .then(() => server.listen())
    .then(() => console.log('Speculative Fiction & Philosophy MCP Server is running!'))
    .catch(error => console.error('Failed to start server:', error));
}
