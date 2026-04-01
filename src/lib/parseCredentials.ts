export interface ParsedCredential {
  service_name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

const KEY_PATTERNS: Record<keyof Omit<ParsedCredential, 'service_name'>, RegExp> = {
  username: /^(login|user|email|usuario|e-?mail|usr|conta|account)$/i,
  password: /^(senha|password|pass|token|key|secret|api[_-]?key|chave)$/i,
  url: /^(url|link|site|endpoint|host|endere[cç]o|dashboard|painel)$/i,
  notes: /^(obs|nota|note|notes|description|desc|descri[cç][aã]o|observa[cç][aã]o|info)$/i,
};

const URL_REGEX = /^https?:\/\/\S+/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MARKDOWN_LINK_REGEX = /^\[([^\]]+)\]\(([^)]+)\)$/;
const MARKDOWN_HEADER_REGEX = /^#{1,6}\s+(.+)$/;

/**
 * Pre-processes raw text to normalize Notion/markdown formats into parseable lines.
 * - Markdown links `[Name](url)` on their own line → treated as service entries
 * - Markdown headers `# Title` → stripped to plain text
 * - Notion link lines with pvs params → cleaned
 */
function preprocess(text: string): string {
  const lines = text.split('\n');
  const processed: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines (preserve them as block separators)
    if (!line) {
      processed.push('');
      continue;
    }

    // Markdown header → plain text (potential group label, skip as entry)
    const headerMatch = line.match(MARKDOWN_HEADER_REGEX);
    if (headerMatch) {
      // Skip headers — they're group titles, not credentials
      continue;
    }

    // Markdown link on its own line → extract as service_name
    const linkMatch = line.match(MARKDOWN_LINK_REGEX);
    if (linkMatch) {
      const name = linkMatch[1].trim();
      // Each link becomes its own service entry (separated by blank line)
      processed.push('');
      processed.push(name);
      continue;
    }

    // Pass through everything else
    processed.push(line);
  }

  return processed.join('\n');
}

function classifyLine(line: string): { field: keyof ParsedCredential | null; value: string } {
  // Try key:value or key=value split
  const separatorMatch = line.match(/^([^:=\t]+)[:\t=]\s*(.+)$/);
  if (separatorMatch) {
    const key = separatorMatch[1].trim();
    const value = separatorMatch[2].trim();

    for (const [field, pattern] of Object.entries(KEY_PATTERNS)) {
      if (pattern.test(key)) {
        return { field: field as keyof ParsedCredential, value };
      }
    }

    // Key matched service_name pattern
    if (/^(nome|name|servi[cç]o|service|projeto|project)$/i.test(key)) {
      return { field: 'service_name', value };
    }

    // Unknown key — treat value as notes
    return { field: 'notes', value: line };
  }

  // No separator — check if it's a URL or email standalone
  const trimmed = line.trim();
  if (URL_REGEX.test(trimmed)) return { field: 'url', value: trimmed };
  if (EMAIL_REGEX.test(trimmed)) return { field: 'username', value: trimmed };

  // Plain text line with no separator — could be service name or notes
  return { field: null, value: trimmed };
}

export function parseCredentials(text: string): ParsedCredential[] {
  if (!text.trim()) return [];

  // Pre-process to handle Notion/markdown formats
  const normalized = preprocess(text);

  // Split into blocks by empty lines
  const blocks = normalized.split(/\n\s*\n/).filter(b => b.trim());

  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const entry: ParsedCredential = {
      service_name: '',
      username: '',
      password: '',
      url: '',
      notes: '',
    };

    let firstUnclassifiedUsed = false;

    for (const line of lines) {
      const { field, value } = classifyLine(line);

      if (field) {
        if (field === 'notes' && entry.notes) {
          entry.notes += '\n' + value;
        } else if (!entry[field]) {
          entry[field] = value;
        } else {
          // Field already filled — append to notes
          entry.notes = entry.notes ? entry.notes + '\n' + value : value;
        }
      } else {
        // Unclassified line — first one becomes service_name if empty
        if (!firstUnclassifiedUsed && !entry.service_name) {
          entry.service_name = value;
          firstUnclassifiedUsed = true;
        } else {
          entry.notes = entry.notes ? entry.notes + '\n' + value : value;
        }
      }
    }

    return entry;
  });
}
