// LaTeX Equation Generator - Advanced Implementation
// This module provides the core functionality for generating LaTeX equations from natural language

import { Claude } from '@anthropic/sdk';
import { ExecuteToolResponseSchema } from '@anthropic-ai/mcp-typescript-sdk';
import * as mathSymbols from './math-symbols-library';

// Initialize Claude client
const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Equation generation parameters interface
 */
interface EquationGenerationParams {
  description: string;
  format: 'inline' | 'display' | 'align' | 'gather' | 'multline';
  numbered: boolean;
  additionalContext?: string;
}

/**
 * Equation generation result interface
 */
interface EquationGenerationResult {
  latex: string;
  preview: string;
  components?: string[];
  explanation?: string;
}

/**
 * Generates LaTeX equations from natural language descriptions using Claude AI
 */
export async function generateEquation(
  params: EquationGenerationParams
): Promise<ExecuteToolResponseSchema> {
  const { description, format, numbered, additionalContext = '' } = params;
  
  try {
    // Check if we have a direct pattern match first
    const patternMatch = matchKnownEquationPattern(description);
    if (patternMatch) {
      return formatEquationResult(patternMatch, format, numbered);
    }
    
    // No pattern match, use Claude to generate the equation
    const equationResult = await generateEquationWithClaude(description, format, numbered, additionalContext);
    return {
      result: equationResult
    };
  } catch (error) {
    console.error('Error generating equation:', error);
    throw new Error(`Failed to generate equation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Matches known equation patterns to quickly generate common equations
 * This is used as a fast path for frequently requested equations
 */
function matchKnownEquationPattern(description: string): EquationGenerationResult | null {
  // Convert description to lowercase for easier matching
  const lowerDesc = description.toLowerCase();
  
  // Common equation patterns
  const equationPatterns = [
    {
      patterns: ['quadratic formula', 'quadratic equation solution'],
      latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      components: ['variable x', 'coefficients a, b, c', 'square root', 'plus-minus operator'],
      explanation: 'The quadratic formula provides solutions to any quadratic equation ax² + bx + c = 0.'
    },
    {
      patterns: ['pythagorean theorem', 'right triangle relation'],
      latex: 'a^2 + b^2 = c^2',
      components: ['sides a and b', 'hypotenuse c', 'squared terms'],
      explanation: 'The Pythagorean theorem relates the sides of a right triangle.'
    },
    {
      patterns: ['euler identity', 'euler\'s formula', 'euler\'s identity'],
      latex: 'e^{i\\pi} + 1 = 0',
      components: ['euler\'s number e', 'imaginary unit i', 'pi constant', 'exponential function'],
      explanation: 'Euler\'s identity connects five fundamental mathematical constants in a single formula.'
    },
    {
      patterns: ['normal distribution', 'gaussian distribution', 'probability density function', 'pdf normal'],
      latex: 'f(x | \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
      components: ['function notation', 'mean μ', 'variance σ²', 'exponential function', 'fraction'],
      explanation: 'The normal distribution probability density function describes the distribution of continuous data.'
    },
    {
      patterns: ['maxwell equation', 'gauss\'s law', 'electric field divergence'],
      latex: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}',
      components: ['nabla operator', 'dot product', 'electric field vector', 'charge density', 'vacuum permittivity'],
      explanation: 'Gauss\'s law for electricity (one of Maxwell\'s equations) relates electric field to charge density.'
    },
    {
      patterns: ['navier-stokes', 'fluid dynamics equation'],
      latex: '\\rho \\left( \\frac{\\partial \\vec{v}}{\\partial t} + \\vec{v} \\cdot \\nabla \\vec{v} \\right) = -\\nabla p + \\nabla \\cdot \\mathbf{T} + \\vec{f}',
      components: ['density ρ', 'velocity vector', 'pressure gradient', 'stress tensor', 'body forces'],
      explanation: 'The Navier-Stokes equations describe the motion of fluid substances.'
    },
    {
      patterns: ['schrodinger equation', 'quantum mechanics', 'wave function equation'],
      latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)',
      components: ['imaginary unit i', 'reduced Planck constant', 'wave function', 'Hamiltonian operator'],
      explanation: 'The Schrödinger equation describes how the quantum state of a physical system changes over time.'
    },
    {
      patterns: ['einstein field equations', 'general relativity', 'spacetime curvature'],
      latex: 'R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}',
      components: ['Ricci curvature tensor', 'metric tensor', 'cosmological constant', 'stress-energy tensor'],
      explanation: 'Einstein\'s field equations describe the fundamental interaction of gravitation in general relativity.'
    },
    {
      patterns: ['taylor series', 'taylor expansion'],
      latex: 'f(x) = f(a) + \\frac{f\'(a)}{1!}(x-a) + \\frac{f\'\'(a)}{2!}(x-a)^2 + \\frac{f\'\'\'(a)}{3!}(x-a)^3 + \\cdots',
      components: ['function values', 'derivatives', 'factorial notation', 'power series'],
      explanation: 'A Taylor series expands a function into an infinite sum of terms derived from the function\'s derivatives at a single point.'
    },
    {
      patterns: ['fourier transform', 'fourier analysis'],
      latex: '\\mathcal{F}[f(t)] = F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt',
      components: ['integral', 'function in time domain', 'exponential term', 'angular frequency'],
      explanation: 'The Fourier transform converts a function of time to a function of frequency.'
    }
  ];
  
  // Check each pattern for a match
  for (const pattern of equationPatterns) {
    if (pattern.patterns.some(p => lowerDesc.includes(p))) {
      return {
        latex: pattern.latex,
        preview: `Preview: ${pattern.latex}`,
        components: pattern.components,
        explanation: pattern.explanation
      };
    }
  }
  
  // Special case for checking if we need to derive an equation
  if (lowerDesc.includes('derivative') || lowerDesc.includes('differentiate')) {
    // Extract the function to differentiate
    const functionMatch = /(?:derivative of|differentiate) (f\(x\) = .+?)(?:with respect to|$)/.exec(lowerDesc);
    if (functionMatch && functionMatch[1]) {
      return handleDerivative(functionMatch[1]);
    }
  }
  
  // Special case for checking if we need to integrate
  if (lowerDesc.includes('integral') || lowerDesc.includes('integrate')) {
    // Extract the function to integrate
    const functionMatch = /(?:integral of|integrate) (f\(x\) = .+?)(?:with respect to|$)/.exec(lowerDesc);
    if (functionMatch && functionMatch[1]) {
      return handleIntegration(functionMatch[1]);
    }
  }
  
  // No match found
  return null;
}

/**
 * Handles derivative requests
 * This is a simple implementation that handles basic functions
 */
function handleDerivative(functionText: string): EquationGenerationResult {
  // Extract the function expression
  const expressionMatch = /f\(x\) = (.+)/.exec(functionText);
  if (!expressionMatch) {
    return {
      latex: '\\frac{d}{dx}[?]',
      preview: 'Could not parse function for differentiation',
    };
  }
  
  const expression = expressionMatch[1].trim();
  let derivative = '';
  let explanation = '';
  
  // Very simple differentiation rules
  if (expression.match(/^x\^(\d+)$/)) {
    // Power rule: d/dx(x^n) = n*x^(n-1)
    const power = parseInt(expression.match(/^x\^(\d+)$/)[1]);
    const newPower = power - 1;
    derivative = power === 1 
      ? '1' 
      : (power === 2 
        ? '2x' 
        : `${power}x^{${newPower}}`);
    explanation = `Using the power rule: d/dx(x^n) = n·x^(n-1)`;
  } else if (expression === 'sin(x)') {
    // Derivative of sin(x) is cos(x)
    derivative = 'cos(x)';
    explanation = 'The derivative of sin(x) is cos(x)';
  } else if (expression === 'cos(x)') {
    // Derivative of cos(x) is -sin(x)
    derivative = '-sin(x)';
    explanation = 'The derivative of cos(x) is -sin(x)';
  } else if (expression === 'e^x') {
    // Derivative of e^x is e^x
    derivative = 'e^x';
    explanation = 'The derivative of e^x is e^x';
  } else if (expression === 'ln(x)') {
    // Derivative of ln(x) is 1/x
    derivative = '\\frac{1}{x}';
    explanation = 'The derivative of ln(x) is 1/x';
  } else {
    // Default case for unknown functions
    derivative = '\\frac{d}{dx}[' + expression + ']';
    explanation = 'Symbolic representation of the derivative';
  }
  
  return {
    latex: derivative,
    preview: `Preview: ${derivative}`,
    explanation
  };
}

/**
 * Handles integration requests
 * This is a simple implementation that handles basic functions
 */
function handleIntegration(functionText: string): EquationGenerationResult {
  // Extract the function expression
  const expressionMatch = /f\(x\) = (.+)/.exec(functionText);
  if (!expressionMatch) {
    return {
      latex: '\\int{?}\\,dx',
      preview: 'Could not parse function for integration',
    };
  }
  
  const expression = expressionMatch[1].trim();
  let integral = '';
  let explanation = '';
  
  // Very simple integration rules
  if (expression.match(/^x\^(\d+)$/)) {
    // Power rule: ∫x^n dx = x^(n+1)/(n+1) + C
    const power = parseInt(expression.match(/^x\^(\d+)$/)[1]);
    const newPower = power + 1;
    integral = `\\frac{x^{${newPower}}}{${newPower}} + C`;
    explanation = `Using the power rule: ∫x^n dx = x^(n+1)/(n+1) + C`;
  } else if (expression === 'sin(x)') {
    // Integral of sin(x) is -cos(x) + C
    integral = '-cos(x) + C';
    explanation = 'The integral of sin(x) is -cos(x) + C';
  } else if (expression === 'cos(x)') {
    // Integral of cos(x) is sin(x) + C
    integral = 'sin(x) + C';
    explanation = 'The integral of cos(x) is sin(x) + C';
  } else if (expression === 'e^x') {
    // Integral of e^x is e^x + C
    integral = 'e^x + C';
    explanation = 'The integral of e^x is e^x + C';
  } else if (expression === '1/x') {
    // Integral of 1/x is ln|x| + C
    integral = 'ln|x| + C';
    explanation = 'The integral of 1/x is ln|x| + C';
  } else {
    // Default case for unknown functions
    integral = '\\int{' + expression + '}\\,dx';
    explanation = 'Symbolic representation of the integral';
  }
  
  return {
    latex: integral,
    preview: `Preview: ${integral}`,
    explanation
  };
}

/**
 * Formats the equation result based on the desired format and numbering
 */
function formatEquationResult(
  result: EquationGenerationResult,
  format: string,
  numbered: boolean
): ExecuteToolResponseSchema {
  let formattedLatex = '';
  
  // Format the equation
  switch (format) {
    case 'inline':
      formattedLatex = `$${result.latex}$`;
      break;
    case 'display':
      formattedLatex = numbered
        ? `\\begin{equation}\n  ${result.latex}\n\\end{equation}`
        : `\\begin{equation*}\n  ${result.latex}\n\\end{equation*}`;
      break;
    case 'align':
      formattedLatex = numbered
        ? `\\begin{align}\n  ${result.latex}\n\\end{align}`
        : `\\begin{align*}\n  ${result.latex}\n\\end{align*}`;
      break;
    case 'gather':
      formattedLatex = numbered
        ? `\\begin{gather}\n  ${result.latex}\n\\end{gather}`
        : `\\begin{gather*}\n  ${result.latex}\n\\end{gather*}`;
      break;
    case 'multline':
      formattedLatex = numbered
        ? `\\begin{multline}\n  ${result.latex}\n\\end{multline}`
        : `\\begin{multline*}\n  ${result.latex}\n\\end{multline*}`;
      break;
    default:
      formattedLatex = `\\begin{equation*}\n  ${result.latex}\n\\end{equation*}`;
  }
  
  return {
    result: {
      latex: formattedLatex,
      preview: result.preview,
      components: result.components,
      explanation: result.explanation
    }
  };
}

/**
 * Uses Claude to generate LaTeX equations for more complex cases
 */
async function generateEquationWithClaude(
  description: string,
  format: string,
  numbered: boolean,
  additionalContext: string
): Promise<EquationGenerationResult> {
  // Construct the prompt for Claude
  const prompt = `
You are an expert in LaTeX for mathematical and scientific documents. Your task is to convert a natural language description into a correct LaTeX equation.

Description: ${description}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Please provide the LaTeX code for this equation. Only include the mathematical expression itself, not the surrounding environment tags like \\begin{equation} or $. The equation should be mathematically correct and follow standard notation for the relevant field.

Also, provide a brief explanation of the key components in the equation.
`;

  try {
    // Call Claude to generate the equation
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for more deterministic results
      system: "You are a LaTeX expert focused on mathematical and scientific equations. Provide precise, correct LaTeX code for equations based on natural language descriptions.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the LaTeX code and explanation from Claude's response
    const fullResponse = response.content[0].text;
    
    // Parse the response to extract the equation and explanation
    const latexMatch = fullResponse.match(/```latex\n([\s\S]*?)\n```/) || 
                      fullResponse.match(/`(.*?)`/) ||
                      fullResponse.match(/LaTeX code:([\s\S]*?)(?:\n\n|$)/);
    
    let latexCode = '';
    if (latexMatch) {
      latexCode = latexMatch[1].trim();
    } else {
      // Fallback: try to extract anything that looks like LaTeX
      const potentialLatex = fullResponse.match(/\\[a-zA-Z]+(\{.*?\})?/) || [''];
      latexCode = potentialLatex[0];
    }
    
    // Extract explanation
    const explanationMatch = fullResponse.match(/explanation:([\s\S]*?)(?:\n\n|$)/i) ||
                             fullResponse.match(/components:([\s\S]*?)(?:\n\n|$)/i) ||
                             fullResponse.match(/explanation\n\n([\s\S]*?)(?:\n\n|$)/i);
    
    let explanation = explanationMatch 
      ? explanationMatch[1].trim() 
      : 'Generated equation based on the provided description.';
    
    // Format the result
    const result: EquationGenerationResult = {
      latex: latexCode,
      preview: `Preview: ${latexCode}`,
      explanation
    };
    
    return result;
  } catch (error) {
    console.error('Error calling Claude:', error);
    throw new Error('Failed to generate equation with Claude.');
  }
}

/**
 * Validates the LaTeX equation for syntax errors
 */
export function validateEquation(latex: string): string[] {
  const errors: string[] = [];
  
  // Check for unbalanced braces
  const openBraces = (latex.match(/\{/g) || []).length;
  const closeBraces = (latex.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening and ${closeBraces} closing braces`);
  }
  
  // Check for unbalanced dollar signs (for inline math)
  const dollarSigns = (latex.match(/\$/g) || []).length;
  if (dollarSigns % 2 !== 0) {
    errors.push('Unbalanced dollar signs for inline math');
  }
  
  // Check for mismatched environment tags
  const beginEnvs = latex.match(/\\begin\{([^}]+)\}/g) || [];
  const endEnvs = latex.match(/\\end\{([^}]+)\}/g) || [];
  
  if (beginEnvs.length !== endEnvs.length) {
    errors.push(`Mismatched environment tags: ${beginEnvs.length} \\begin and ${endEnvs.length} \\end tags`);
  } else {
    // Check if each begin has a matching end
    for (let i = 0; i < beginEnvs.length; i++) {
      const beginEnv = beginEnvs[i].match(/\\begin\{([^}]+)\}/)[1];
      const endEnv = endEnvs[beginEnvs.length - 1 - i].match(/\\end\{([^}]+)\}/)[1];
      
      if (beginEnv !== endEnv) {
        errors.push(`Mismatched environment: \\begin{${beginEnv}} and \\end{${endEnv}}`);
      }
    }
  }
  
  // Check for undefined control sequences
  const controlSequences = latex.match(/\\[a-zA-Z]+/g) || [];
  for (const seq of controlSequences) {
    const command = seq.substring(1); // Remove the backslash
    if (!mathSymbols.isValidCommand(command)) {
      errors.push(`Potentially undefined control sequence: ${seq}`);
    }
  }
  
  return errors;
}

/**
 * Math symbol validation module import stub
 * In a real implementation, this would be a comprehensive library
 */
declare module './math-symbols-library' {
  export function isValidCommand(command: string): boolean;
}
