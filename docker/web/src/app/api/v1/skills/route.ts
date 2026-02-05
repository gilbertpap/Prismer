import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const SKILLS_DIR = '/workspace/skills';

interface SkillFrontmatter {
  name?: string;
  description?: string;
  metadata?: {
    openclaw?: {
      emoji?: string;
      category?: string;
      os?: string[];
    };
  };
}

interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  path: string;
  enabled: boolean;
}

/**
 * Simple YAML frontmatter parser for SKILL.md files
 */
function parseFrontmatter(content: string): { data: SkillFrontmatter; content: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const yamlContent = match[1];
  const bodyContent = match[2];

  // Simple YAML parser for our known structure
  const data: SkillFrontmatter = {};
  const lines = yamlContent.split('\n');

  let currentKey = '';
  let inMetadata = false;
  let inOpenclaw = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for top-level keys
    const topLevelMatch = line.match(/^(\w+):\s*(.*)$/);
    if (topLevelMatch) {
      const [, key, value] = topLevelMatch;
      currentKey = key;
      inMetadata = key === 'metadata';
      inOpenclaw = false;

      if (key === 'name' && value) {
        data.name = value.trim();
      } else if (key === 'description' && value) {
        data.description = value.trim();
      }
    }

    // Check for nested openclaw key
    if (inMetadata && line.match(/^\s+openclaw:\s*$/)) {
      inOpenclaw = true;
      if (!data.metadata) data.metadata = {};
      if (!data.metadata.openclaw) data.metadata.openclaw = {};
    }

    // Parse openclaw properties
    if (inOpenclaw) {
      const emojiMatch = line.match(/^\s+emoji:\s*["']?([^"'\n]+)["']?\s*$/);
      const categoryMatch = line.match(/^\s+category:\s*["']?([^"'\n]+)["']?\s*$/);
      const osMatch = line.match(/^\s+os:\s*\[(.*)\]\s*$/);

      if (emojiMatch) {
        data.metadata!.openclaw!.emoji = emojiMatch[1].trim();
      } else if (categoryMatch) {
        data.metadata!.openclaw!.category = categoryMatch[1].trim();
      } else if (osMatch) {
        data.metadata!.openclaw!.os = osMatch[1].split(',').map((s) => s.trim().replace(/["']/g, ''));
      }
    }
  }

  return { data, content: bodyContent };
}

/**
 * Skills API - List and manage agent skills
 */

// GET /api/v1/skills - List all available skills
export async function GET() {
  try {
    const skills: Skill[] = [];

    // Check if skills directory exists
    const dirExists = await fs.stat(SKILLS_DIR).catch(() => null);
    if (!dirExists) {
      return Response.json({ skills: [], total: 0 });
    }

    // Read skill directories
    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(SKILLS_DIR, entry.name);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      // Check if SKILL.md exists
      const skillMdExists = await fs.stat(skillMdPath).catch(() => null);
      if (!skillMdExists) continue;

      try {
        // Read and parse SKILL.md
        const content = await fs.readFile(skillMdPath, 'utf-8');
        const { data: frontmatter } = parseFrontmatter(content);

        const openclawMeta = frontmatter.metadata?.openclaw || {};

        skills.push({
          id: entry.name,
          name: frontmatter.name || entry.name,
          description: frontmatter.description || '',
          emoji: openclawMeta.emoji || '🔧',
          category: openclawMeta.category || 'general',
          path: skillPath,
          enabled: true,
        });
      } catch (parseError) {
        console.error(`[skills] Error parsing ${skillMdPath}:`, parseError);
        skills.push({
          id: entry.name,
          name: entry.name,
          description: 'Unable to parse skill metadata',
          emoji: '❓',
          category: 'unknown',
          path: skillPath,
          enabled: true,
        });
      }
    }

    // Sort by category then name
    skills.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return Response.json({
      skills,
      total: skills.length,
    });
  } catch (error) {
    console.error('[skills] Error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// POST /api/v1/skills - Get single skill details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'Skill ID is required' } },
        { status: 400 }
      );
    }

    // Validate skill ID (prevent path traversal)
    if (id.includes('..') || id.includes('/')) {
      return Response.json(
        { error: { code: 'INVALID_ID', message: 'Invalid skill ID' } },
        { status: 400 }
      );
    }

    const skillPath = path.join(SKILLS_DIR, id);
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    // Check if skill exists
    const skillMdExists = await fs.stat(skillMdPath).catch(() => null);
    if (!skillMdExists) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Skill not found' } },
        { status: 404 }
      );
    }

    // Read full skill content
    const content = await fs.readFile(skillMdPath, 'utf-8');
    const { data: frontmatter, content: bodyContent } = parseFrontmatter(content);

    const openclawMeta = frontmatter.metadata?.openclaw || {};

    return Response.json({
      id,
      name: frontmatter.name || id,
      description: frontmatter.description || '',
      emoji: openclawMeta.emoji || '🔧',
      category: openclawMeta.category || 'general',
      os: openclawMeta.os || [],
      path: skillPath,
      enabled: true,
      content: bodyContent.trim(),
    });
  } catch (error) {
    console.error('[skills] Error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
