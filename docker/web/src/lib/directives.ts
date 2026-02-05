/**
 * UI Directives System
 *
 * Allows the agent to control UI state by embedding directives in output.
 *
 * Directive format in agent output:
 *   [[UI:action:payload]]
 *
 * Examples:
 *   [[UI:show_artifact:/workspace/output/chart.png]]
 *   [[UI:switch_editor:pdf-reader]]
 *   [[UI:open_file:/workspace/output/report.pdf]]
 *   [[UI:refresh_artifacts]]
 *   [[UI:notify:success:File generated successfully]]
 */

import type { EditorType } from '@/types/workspace';

// Directive types that can be sent from agent to UI
export type UIDirectiveType =
  | 'show_artifact'      // Select and highlight an artifact
  | 'switch_editor'      // Switch to a specific editor
  | 'open_file'          // Open a file in the appropriate viewer
  | 'refresh_artifacts'  // Refresh the artifacts list
  | 'refresh_skills'     // Refresh the skills list
  | 'open_panel'         // Open a specific panel (tasks/skills/artifacts)
  | 'notify'             // Show a notification
  | 'set_content'        // Set content in an editor
  | 'run_code';          // Execute code in Jupyter

export interface UIDirective {
  type: UIDirectiveType;
  payload: string;
  metadata?: Record<string, string>;
}

// Regex to match UI directives in agent output
// Format: [[UI:type:payload]] or [[UI:type:key1=value1,key2=value2:payload]]
const DIRECTIVE_REGEX = /\[\[UI:(\w+)(?::([^\]:]+))?(?::([^\]]+))?\]\]/g;

/**
 * Parse UI directives from agent output text
 * Returns the cleaned text (without directives) and the list of directives
 */
export function parseDirectives(text: string): {
  cleanText: string;
  directives: UIDirective[];
} {
  const directives: UIDirective[] = [];

  const cleanText = text.replace(DIRECTIVE_REGEX, (match, type, metaOrPayload, payload) => {
    const directive: UIDirective = { type, payload: '' };

    // Check if second group is metadata (contains =) or payload
    if (metaOrPayload) {
      if (metaOrPayload.includes('=') && payload) {
        // Has metadata and payload
        directive.metadata = parseMetadata(metaOrPayload);
        directive.payload = payload;
      } else {
        // Just payload, no metadata
        directive.payload = metaOrPayload;
      }
    }

    directives.push(directive);
    return ''; // Remove directive from text
  });

  return {
    cleanText: cleanText.trim(),
    directives,
  };
}

function parseMetadata(metaString: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const pairs = metaString.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      meta[key.trim()] = value.trim();
    }
  }
  return meta;
}

/**
 * Determine the appropriate editor for a file path
 */
export function getEditorForFile(filePath: string): EditorType {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'pdf':
      return 'pdf-reader';
    case 'ipynb':
      return 'jupyter';
    case 'tex':
      return 'latex';
    case 'py':
    case 'js':
    case 'ts':
    case 'json':
      return 'code-playground';
    default:
      return 'ai-editor';
  }
}

/**
 * Format a directive string for the agent to use
 */
export function formatDirective(type: UIDirectiveType, payload: string, metadata?: Record<string, string>): string {
  if (metadata && Object.keys(metadata).length > 0) {
    const metaStr = Object.entries(metadata).map(([k, v]) => `${k}=${v}`).join(',');
    return `[[UI:${type}:${metaStr}:${payload}]]`;
  }
  return `[[UI:${type}:${payload}]]`;
}
