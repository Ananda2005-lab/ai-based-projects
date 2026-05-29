const KEYWORDS: Record<string, string[]> = {
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'async', 'await', 'pass', 'break', 'continue', 'raise', 'assert', 'del', 'global', 'nonlocal', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'],
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum', 'namespace', 'declare', 'readonly', 'private', 'public', 'protected'],
  java: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'import', 'package', 'return', 'void', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'true', 'false', 'null', 'instanceof'],
  cpp: ['int', 'float', 'double', 'char', 'bool', 'void', 'auto', 'const', 'static', 'extern', 'inline', 'virtual', 'override', 'class', 'struct', 'enum', 'union', 'public', 'private', 'protected', 'template', 'typename', 'namespace', 'using', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'new', 'delete', 'this', 'true', 'false', 'nullptr'],
  go: ['package', 'import', 'func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'goto', 'defer', 'panic', 'recover', 'go', 'chan', 'select', 'struct', 'interface', 'type', 'map', 'make', 'new', 'len', 'cap', 'append', 'copy', 'close', 'var', 'const', 'true', 'false', 'nil'],
  rust: ['fn', 'let', 'mut', 'const', 'static', 'type', 'struct', 'enum', 'trait', 'impl', 'pub', 'use', 'mod', 'crate', 'super', 'self', 'return', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'async', 'await', 'move', 'ref', 'where', 'unsafe', 'true', 'false', 'None', 'Some', 'Ok', 'Err'],
  html: ['div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'main', 'form', 'input', 'button', 'label', 'select', 'option', 'textarea', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'style', 'script', 'link', 'meta', 'title', 'body', 'head', 'html'],
  css: ['display', 'position', 'width', 'height', 'margin', 'padding', 'border', 'background', 'color', 'font', 'text', 'flex', 'grid', 'align', 'justify', 'content', 'items', 'overflow', 'z-index', 'opacity', 'transform', 'transition', 'animation', 'media', 'import', 'keyframes'],
};

const TYPES: Record<string, string[]> = {
  python: ['int', 'str', 'float', 'bool', 'list', 'dict', 'tuple', 'set', 'bytes', 'object', 'type'],
  javascript: ['Number', 'String', 'Boolean', 'Array', 'Object', 'Function', 'Date', 'RegExp', 'Error', 'Promise', 'Map', 'Set', 'Symbol', 'BigInt'],
  typescript: ['number', 'string', 'boolean', 'any', 'unknown', 'never', 'void', 'Array', 'Record', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract', 'ReturnType', 'Parameters', 'Promise'],
  java: ['String', 'Integer', 'Double', 'Boolean', 'List', 'Map', 'Set', 'ArrayList', 'HashMap', 'HashSet', 'Optional', 'Stream'],
  cpp: ['string', 'vector', 'map', 'set', 'unordered_map', 'unordered_set', 'queue', 'stack', 'deque', 'pair', 'tuple', 'unique_ptr', 'shared_ptr'],
  go: ['string', 'int', 'int64', 'float64', 'bool', 'error', 'rune', 'byte', 'slice', 'map', 'chan', 'interface{}'],
  rust: ['String', 'Vec', 'HashMap', 'HashSet', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'RefCell', 'Cell', 'Mutex', 'RwLock'],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCode(code: string, language: string = 'javascript'): string {
  const lang = language.toLowerCase();
  const keywords = KEYWORDS[lang] || KEYWORDS.javascript;
  const types = TYPES[lang] || [];
  
  const lines = code.split('\n');
  
  return lines.map((line, lineNum) => {
    let processed = escapeHtml(line);
    
    // Comments (simplified)
    if (lang === 'python') {
      processed = processed.replace(/(#.*$)/, '<span class="syntax-comment">$1</span>');
    } else if (['javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'css'].includes(lang)) {
      processed = processed.replace(/(\/\/.*$)/, '<span class="syntax-comment">$1</span>');
    } else if (lang === 'html') {
      processed = processed.replace(/(&lt;!--.*?--&gt;)/, '<span class="syntax-comment">$1</span>');
    }
    
    // Strings
    processed = processed.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="syntax-string">$1</span>');
    processed = processed.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="syntax-string">$1</span>');
    if (lang === 'python') {
      processed = processed.replace(/(`(?:[^`]|\\.)*`)/g, '<span class="syntax-string">$1</span>');
    }
    
    // Numbers
    processed = processed.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');
    
    // Keywords (avoid replacing inside already-colored spans)
    const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    processed = processed.replace(keywordPattern, '<span class="syntax-keyword">$1</span>');
    
    // Types
    const typePattern = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    processed = processed.replace(typePattern, '<span class="syntax-type">$1</span>');
    
    // Functions
    processed = processed.replace(/(\w+)(\()/g, '<span class="syntax-function">$1</span>$2');
    
    return `<div class="line"><span class="line-number text-slate-600 select-none mr-4 text-xs">${lineNum + 1}</span>${processed}</div>`;
  }).join('');
}

export function detectLanguage(code: string): string {
  if (code.includes('def ') || code.includes('import ') && code.includes(':')) return 'python';
  if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
  if (code.includes('function ') || code.includes('const ') || code.includes('=>')) return 'javascript';
  if (code.includes('public class') || code.includes('System.out.println')) return 'java';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('package main') || code.includes('func ')) return 'go';
  if (code.includes('fn ') || code.includes('let mut')) return 'rust';
  if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
  if (code.includes('@media') || code.includes('display:')) return 'css';
  return 'javascript';
}
