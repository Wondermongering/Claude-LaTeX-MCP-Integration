/**
 * LaTeX Math Symbols Library
 * ---------------------------------------------------------------
 *  – Valid‑command registry
 *  – Helpers: isValidCommand · categorizeCommand · getSuggestions
 * ---------------------------------------------------------------
 */

const VALID_MATH_COMMANDS = new Set<string>([
  /* ------------- Greek letters ------------- */
  'alpha','beta','gamma','delta','epsilon','varepsilon','zeta','eta','theta','vartheta',
  'iota','kappa','lambda','mu','nu','xi','pi','varpi','rho','varrho','sigma','varsigma',
  'tau','upsilon','phi','varphi','chi','psi','omega',
  'Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon','Phi','Psi','Omega',
  /* --------- Binary relations & operators --------- */
  'leq','geq','equiv','neq','sim','approx','cong','propto','prec','succ','preceq','succeq',
  'll','gg','subset','supset','subseteq','supseteq','in','ni','vdash','dashv',
  'pm','mp','times','div','cdot','ast','star','cap','cup','vee','wedge','oplus','otimes',
  'circ','bullet','diamond','Box','triangleleft','triangleright','dagger','ddagger',
  /* ------------- Big operators ------------- */
  'sum','prod','int','oint','bigcap','bigcup','bigvee','bigwedge','bigoplus','bigotimes',
  /* ---------------- Arrows ---------------- */
  'leftarrow','Leftarrow','rightarrow','Rightarrow','leftrightarrow','Leftrightarrow',
  'mapsto','hookleftarrow','hookrightarrow','uparrow','Uparrow','downarrow','Downarrow',
  'updownarrow','Updownarrow','longleftarrow','Longleftarrow','longrightarrow','Longrightarrow',
  'longleftrightarrow','Longleftrightarrow',
  /* -------------- Delimiters -------------- */
  'langle','rangle','lfloor','rfloor','lceil','rceil','lbrace','rbrace',
  /* -------- Font & formatting commands -------- */
  'mathbf','mathit','mathsf','mathrm','mathcal','mathbb','mathfrak','mathscr',
  'infty','nabla','partial','emptyset','exists','forall','neg','triangle','angle','hbar',
  'imath','jmath','ell','wp','Re','Im','aleph','beth','gimel','bot','top',
  'arccos','arcsin','arctan','arg','cos','cosh','cot','coth','csc','deg','det','dim',
  'exp','gcd','hom','inf','ker','lg','lim','liminf','limsup','ln','log','max','min',
  'Pr','sec','sin','sinh','sup','tan','tanh',
  'hat','check','breve','acute','grave','tilde','bar','vec','dot','ddot',
  'frac','sqrt','overline','underline','overbrace','underbrace','widehat','widetilde',
  'overleftarrow','overrightarrow',
  'matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','array',
  'begin','end','left','right','big','Big','bigg','Bigg',
  'quad','qquad','hspace','vspace','thickspace','medspace','thinspace',
  'operatorname','limits',
  'equation','equation*','align','align*','gather','gather*','multline','multline*',
  'split','cases','aligned','gathered',
  'text','textbf','textit','textrm','textsf','texttt','textsc',
  'newcommand','renewcommand','section','subsection','subsubsection',
  'mbox','hfill','vfill',
  /* Units */
  'unit','meter','gram','second','ampere','kelvin','mole','candela',
  /* Special */
  'LaTeX','TeX'
]);

/* -------------------------------------------------- */
export function isValidCommand(cmd: string): boolean {
  if (cmd.includes('\\')) {
    return cmd.split('\\').every(p => !p || isValidCommand(p));
  }
  const base = cmd.split('{')[0].trim();
  if (base === 'newcommand' || base === 'renewcommand') return true;
  return VALID_MATH_COMMANDS.has(base);
}

export function categorizeCommand(cmd: string): string {
  const base = cmd.split('{')[0].trim();

  if (/^(alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega)$/i.test(base))
    return 'Greek letter';

  if (/^(sum|prod|int|oint|bigcap|bigcup|bigvee|bigwedge)$/i.test(base))
    return 'Big operator';

  if (/^(frac|sqrt|overline|underline|vec|hat|bar|dot)$/i.test(base))
    return 'Formatting';

  if (/^(sin|cos|tan|exp|log|ln|lim)$/i.test(base))
    return 'Function';

  if (/arrow$/.test(base) || /Rightarrow|Leftarrow|mapsto/.test(base))
    return 'Arrow';

  if (/^(leq|geq|neq|approx|equiv|cong|sim)$/i.test(base))
    return 'Relation';

  if (/^(mathbf|mathit|mathcal|mathfrak|mathbb)$/i.test(base))
    return 'Font style';

  if (/^(begin|end)$/i.test(base))
    return 'Environment';

  return 'Other';
}

export function getSuggestions(bad: string): string[] {
  const dist = (a: string, b: string): number => {
    if (a === b) return 0;
    const dp = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) dp[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        dp[i][j] =
          b[i - 1] === a[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
      }
    }
    return dp[b.length][a.length];
  };

  return [...VALID_MATH_COMMANDS]
    .map(cmd => ({ cmd, d: dist(bad, cmd) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(o => o.cmd);
}

export { VALID_MATH_COMMANDS };
export default { isValidCommand, categorizeCommand, getSuggestions, VALID_MATH_COMMANDS };
