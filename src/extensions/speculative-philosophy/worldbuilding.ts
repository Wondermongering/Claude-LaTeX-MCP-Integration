import { ToolDefinition, ExecuteToolResponseSchema } from "@anthropic-ai/mcp-typescript-sdk";
export const WORLDBUILDING_TOOL: ToolDefinition = {
  name: 'create-worldbuilding-document',
  description: 'Creates structured LaTeX documentation for speculative fiction worldbuilding',
  parameters: {
    type: 'object',
    properties: {
      worldName: {
        type: 'string',
        description: 'Name of the fictional world',
      },
      worldType: {
        type: 'string',
        enum: ['sci-fi', 'fantasy', 'alternate-history', 'post-apocalyptic', 'magical-realism', 'cyberpunk', 'solarpunk', 'other'],
        description: 'Type of speculative fiction world',
      },
      keyElements: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Key world elements to document (e.g., magic system, technology, history)',
      },
      description: {
        type: 'string',
        description: 'Brief description of the world and its core concepts',
      },
    },
    required: ['worldName', 'description'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the worldbuilding document',
      },
      sections: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of sections created in the document',
      },
    },
  },
};
export async function handleWorldbuildingDocument(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { worldName, worldType = 'other', keyElements = [], description } = parameters;
  
  // This is where we'd integrate with Claude for advanced generation
  // For now, we'll implement a template-based approach
  
  // Default sections for worldbuilding
  const defaultSections = [
    'Overview',
    'History',
    'Geography',
    'Culture',
    'Magic/Technology',
    'Political Structure',
    'Key Locations',
    'Notable Characters',
    'Conflicts',
    'Themes',
  ];
  
  // Add any additional sections from keyElements
  const additionalSections = keyElements.filter(elem => !defaultSections.includes(elem));
  const allSections = [...defaultSections, ...additionalSections];
  
  // Create the LaTeX document
  let latex = `\\documentclass[12pt,letterpaper]{article}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{fancyhdr}
\\usepackage{booktabs}
\\usepackage{tikz}
\\usepackage{enumitem}

% Speculative Fiction Worldbuilding Document Style
\\geometry{margin=1in}
\\hypersetup{colorlinks=true, linkcolor=blue, filecolor=magenta, urlcolor=cyan}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{\\textit{${worldName}}}
\\lhead{\\textit{${worldType} World}}
\\cfoot{\\thepage}

\\titleformat{\\section}{\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}[{\\titlerule[0.8pt]}]
\\titleformat{\\subsection}{\\normalfont\\large\\bfseries}{\\thesubsection}{1em}{}

\\begin{document}

\\begin{titlepage}
  \\centering
  \\vspace*{2cm}
  {\\LARGE\\bfseries ${worldName} \\par}
  \\vspace{1cm}
  {\\Large A ${worldType} World\\par}
  \\vspace{2cm}
  
  \\begin{abstract}
  ${description}
  \\end{abstract}
  
  \\vfill
  {\\large \\today\\par}
\\end{titlepage}

\\tableofcontents
\\newpage
`;

  // Add sections
  allSections.forEach(section => {
    latex += `\\section{${section}}
This section contains details about the ${section.toLowerCase()} of ${worldName}.

`;

    // Add subsections for certain main sections
    if (section === 'Geography') {
      latex += `\\subsection{Physical Features}
Describe the major physical features of the world here.

\\subsection{Climate}
Describe the climate patterns of the world here.

\\subsection{Map}
\\begin{center}
[Insert map here]
\\end{center}

`;
    } else if (section === 'Magic/Technology') {
      latex += `\\subsection{Basic Principles}
Outline the fundamental rules or principles of the ${worldType === 'fantasy' ? 'magic system' : 'technology'}.

\\subsection{Limitations}
Describe the limitations and costs of using ${worldType === 'fantasy' ? 'magic' : 'technology'} in this world.

\\subsection{Cultural Impact}
Explain how ${worldType === 'fantasy' ? 'magic' : 'technology'} has shaped the cultures of this world.

`;
    } else if (section === 'Notable Characters') {
      latex += `\\subsection{Character Archetypes}
Describe common character archetypes found in this world.

\\subsection{Key Figures}
List and describe important figures in the world's history or current events.

`;
    }
  });
  
  // Add appendices for additional worldbuilding elements
  latex += `\\appendix
\\section{Glossary}
\\begin{description}[style=nextline]
\\item[Term] Definition of the term.
\\item[Another Term] Definition of another term.
\\end{description}

\\section{Timeline of Key Events}
\\begin{tabular}{p{3cm}p{12cm}}
\\toprule
\\textbf{Date/Time} & \\textbf{Event} \\\\
\\midrule
Time period & Description of historical event \\\\
Another period & Description of another historical event \\\\
\\bottomrule
\\end{tabular}

\\end{document}`;

  return {
    result: {
      latex,
      sections: allSections,
    }
  };
}
