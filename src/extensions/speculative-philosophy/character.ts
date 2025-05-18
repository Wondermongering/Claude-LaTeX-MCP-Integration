import { ToolDefinition, ExecuteToolResponseSchema } from "@anthropic-ai/mcp-typescript-sdk";
export const CHARACTER_DEVELOPMENT_TOOL: ToolDefinition = {
  name: 'create-character-profile',
  description: 'Creates LaTeX templates for detailed character profiles in speculative fiction',
  parameters: {
    type: 'object',
    properties: {
      characterName: {
        type: 'string',
        description: 'Name of the character',
      },
      characterType: {
        type: 'string',
        enum: ['protagonist', 'antagonist', 'supporting', 'mentor', 'foil', 'other'],
        description: 'Role of the character in the narrative',
      },
      basicDescription: {
        type: 'string',
        description: 'Basic description of the character',
      },
      worldContext: {
        type: 'string',
        description: 'The speculative fiction context the character exists in',
      },
      detailLevel: {
        type: 'string',
        enum: ['basic', 'detailed', 'comprehensive'],
        description: 'Level of detail for the character profile',
        default: 'detailed',
      },
    },
    required: ['characterName', 'basicDescription'],
  },
  returns: {
    type: 'object',
    properties: {
      latex: {
        type: 'string',
        description: 'Generated LaTeX code for the character profile',
      },
      sections: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of sections in the character profile',
      },
    },
  },
};
export async function handleCharacterProfile(parameters: any): Promise<ExecuteToolResponseSchema> {
  const { 
    characterName, 
    characterType = 'protagonist', 
    basicDescription, 
    worldContext = '',
    detailLevel = 'detailed'
  } = parameters;
  
  // Define sections based on detail level
  let sections: string[] = [];
  
  // Basic sections for all detail levels
  const basicSections = [
    'Basic Information',
    'Physical Description',
    'Personality',
    'Background',
    'Motivations'
  ];
  
  // Additional sections for detailed profile
  const detailedSections = [
    'Relationships',
    'Skills & Abilities',
    'Internal Conflicts',
    'External Conflicts',
    'Character Arc'
  ];
  
  // More sections for comprehensive profile
  const comprehensiveSections = [
    'Psychological Profile',
    'Cultural Context',
    'Symbolic Significance',
    'Alternative Interpretations',
    'Development Notes'
  ];
  
  // Build section list based on detail level
  if (detailLevel === 'basic') {
    sections = basicSections;
  } else if (detailLevel === 'detailed') {
    sections = [...basicSections, ...detailedSections];
  } else { // comprehensive
    sections = [...basicSections, ...detailedSections, ...comprehensiveSections];
  }
  
  // Create LaTeX document
  let latex = `\\documentclass[12pt]{article}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{tikz}
\\usepackage{enumitem}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\usepackage{hyperref}

% Character Profile Style
\\geometry{margin=1in}
\\hypersetup{colorlinks=true, linkcolor=blue, filecolor=magenta, urlcolor=cyan}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{${characterName}}
\\lhead{${characterType}}
\\cfoot{\\thepage}

\\titleformat{\\section}{\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}[{\\titlerule[0.8pt]}]
\\titleformat{\\subsection}{\\normalfont\\large\\bfseries}{\\thesubsection}{1em}{}

\\begin{document}

\\begin{center}
{\\LARGE\\bfseries ${characterName}}\\\\[0.5cm]
{\\large Character Profile - ${characterType}}\\\\[1cm]
\\end{center}

% Character summary
\\begin{quotation}
${basicDescription}
\\end{quotation}

`;

  // Add world context if provided
  if (worldContext) {
    latex += `\\section*{World Context}
${worldContext}

`;
  }

  // Add content for each section
  sections.forEach(section => {
    latex += `\\section{${section}}\n`;
    
    // Add specific content for some sections
    if (section === 'Basic Information') {
      latex += `\\begin{tabular}{p{4cm}p{10cm}}
\\textbf{Full Name:} & ${characterName} \\\\
\\textbf{Role:} & ${characterType} \\\\
\\textbf{Age:} & \\\\
\\textbf{Occupation:} & \\\\
\\textbf{Residence:} & \\\\
\\end{tabular}

`;
    } else if (section === 'Skills & Abilities') {
      latex += `\\subsection{Core Competencies}
List the character's main skills here.

\\subsection{Special Abilities}
Describe any special powers or unique abilities.

\\subsection{Weaknesses}
Describe the character's key weaknesses or limitations.

`;
    } else if (section === 'Character Arc') {
      latex += `\\subsection{Starting Point}
Describe the character's state at the beginning.

\\subsection{Key Transformations}
List the major changes or growth points.

\\subsection{End State}
Describe the character's state at the end of their arc.

`;
    } else if (section === 'Symbolic Significance' && detailLevel === 'comprehensive') {
      latex += `\\subsection{Archetypes}
Discuss any archetypes this character represents.

\\subsection{Symbolic Elements}
Detail symbolic aspects of the character.

\\subsection{Thematic Representation}
Explain how the character embodies key themes.

`;
    } else {
      // Default content placeholder for other sections
      latex += `% Content for ${section}\n\n`;
    }
  });
  
  // Add visual relationship map for detailed and comprehensive profiles
  if (detailLevel !== 'basic') {
    latex += `\\section{Relationship Map}
\\begin{center}
\\begin{tikzpicture}
\\node[draw, circle, fill=blue!20] (main) at (0,0) {${characterName}};
\\node[draw, circle, fill=green!20] (char1) at (2,1) {Character 1};
\\node[draw, circle, fill=green!20] (char2) at (-2,1) {Character 2};
\\node[draw, circle, fill=orange!20] (char3) at (0,-2) {Character 3};

\\draw (main) -- (char1) node[midway, above] {relationship};
\\draw (main) -- (char2) node[midway, above] {relationship};
\\draw (main) -- (char3) node[midway, right] {relationship};
\\end{tikzpicture}
\\end{center}

`;
  }
  
  // End document
  latex += `\\end{document}`;

  return {
    result: {
      latex,
      sections,
    }
  };
}
