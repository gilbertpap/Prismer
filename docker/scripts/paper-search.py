#!/usr/bin/env python3
"""
Paper Search CLI - Search academic papers via arXiv API
Usage: paper-search.py search "transformer attention" --max 5
       paper-search.py details 2301.00001
       paper-search.py download 2301.00001 --output /workspace/papers/
"""

import argparse
import asyncio
import json
import os
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Any, Optional

# Try aiohttp, fall back to urllib
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    import urllib.request
    HAS_AIOHTTP = False

ARXIV_API_URL = "http://export.arxiv.org/api/query"
NAMESPACES = {
    'atom': 'http://www.w3.org/2005/Atom',
    'arxiv': 'http://arxiv.org/schemas/atom',
}


def parse_arxiv_entry(entry: ET.Element) -> dict[str, Any]:
    """Parse an arXiv entry from XML."""
    def get_text(tag: str, ns: str = 'atom') -> str:
        elem = entry.find(f'{{{NAMESPACES[ns]}}}{tag}')
        return elem.text.strip() if elem is not None and elem.text else ""

    entry_id = get_text('id')
    arxiv_id = entry_id.split('/abs/')[-1] if '/abs/' in entry_id else entry_id

    authors = []
    for author in entry.findall(f'{{{NAMESPACES["atom"]}}}author'):
        name_elem = author.find(f'{{{NAMESPACES["atom"]}}}name')
        if name_elem is not None and name_elem.text:
            authors.append(name_elem.text.strip())

    categories = []
    primary_category = entry.find(f'{{{NAMESPACES["arxiv"]}}}primary_category')
    if primary_category is not None:
        categories.append(primary_category.get('term', ''))
    for cat in entry.findall(f'{{{NAMESPACES["atom"]}}}category'):
        term = cat.get('term', '')
        if term and term not in categories:
            categories.append(term)

    return {
        'id': arxiv_id,
        'title': get_text('title').replace('\n', ' '),
        'authors': authors,
        'abstract': get_text('summary').replace('\n', ' '),
        'categories': categories,
        'published': get_text('published')[:10],
        'pdf_url': f"https://arxiv.org/pdf/{arxiv_id}.pdf",
        'abs_url': f"https://arxiv.org/abs/{arxiv_id}",
    }


def search_arxiv_sync(query: str, max_results: int = 10, categories: Optional[list] = None) -> list:
    """Synchronous arXiv search using urllib."""
    search_query = query
    if categories:
        cat_filter = " OR ".join([f"cat:{cat}" for cat in categories])
        search_query = f"({query}) AND ({cat_filter})"

    params = {
        'search_query': search_query,
        'start': 0,
        'max_results': max_results,
        'sortBy': 'relevance',
        'sortOrder': 'descending',
    }
    url = f"{ARXIV_API_URL}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(url, headers={'User-Agent': 'ClawBase/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        content = response.read().decode('utf-8')

    root = ET.fromstring(content)
    results = []
    for entry in root.findall(f'{{{NAMESPACES["atom"]}}}entry'):
        try:
            results.append(parse_arxiv_entry(entry))
        except:
            continue
    return results


def download_pdf_sync(arxiv_id: str, output_dir: str) -> str:
    """Download PDF synchronously."""
    arxiv_id = arxiv_id.replace("arXiv:", "").strip()
    safe_id = arxiv_id.replace("/", "_").replace(":", "_")
    output_path = os.path.join(output_dir, f"{safe_id}.pdf")
    os.makedirs(output_dir, exist_ok=True)

    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    req = urllib.request.Request(pdf_url, headers={'User-Agent': 'ClawBase/1.0'})
    with urllib.request.urlopen(req, timeout=60) as response:
        with open(output_path, 'wb') as f:
            f.write(response.read())
    return output_path


def cmd_search(args):
    """Handle search command."""
    categories = args.categories.split(',') if args.categories else None
    papers = search_arxiv_sync(args.query, args.max, categories)

    if args.json:
        print(json.dumps(papers, indent=2, ensure_ascii=False))
        return

    if not papers:
        print("No papers found.")
        return

    print(f"Found {len(papers)} papers:\n")
    for i, p in enumerate(papers, 1):
        authors = ', '.join(p['authors'][:3]) + (' et al.' if len(p['authors']) > 3 else '')
        print(f"{i}. {p['title']}")
        print(f"   Authors: {authors}")
        print(f"   arXiv: {p['id']} | {', '.join(p['categories'][:2])} | {p['published']}")
        print(f"   PDF: {p['pdf_url']}")
        print()


def cmd_details(args):
    """Handle details command."""
    papers = search_arxiv_sync(f"id:{args.arxiv_id}", max_results=1)
    if not papers:
        print(f"Paper not found: {args.arxiv_id}")
        sys.exit(1)

    p = papers[0]
    if args.json:
        print(json.dumps(p, indent=2, ensure_ascii=False))
        return

    print(f"Title: {p['title']}\n")
    print(f"Authors: {', '.join(p['authors'])}\n")
    print(f"arXiv ID: {p['id']}")
    print(f"Categories: {', '.join(p['categories'])}")
    print(f"Published: {p['published']}\n")
    print(f"Abstract:\n{p['abstract']}\n")
    print(f"PDF: {p['pdf_url']}")
    print(f"Page: {p['abs_url']}")


def cmd_download(args):
    """Handle download command."""
    output_dir = args.output or "/workspace/papers"
    path = download_pdf_sync(args.arxiv_id, output_dir)
    size = os.path.getsize(path)
    print(f"Downloaded: {path} ({size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(description='Search academic papers via arXiv')
    subparsers = parser.add_subparsers(dest='command', required=True)

    # search
    p_search = subparsers.add_parser('search', help='Search papers')
    p_search.add_argument('query', help='Search query')
    p_search.add_argument('--max', type=int, default=10, help='Max results (1-50)')
    p_search.add_argument('--categories', help='Filter by categories (comma-separated)')
    p_search.add_argument('--json', action='store_true', help='Output JSON')
    p_search.set_defaults(func=cmd_search)

    # details
    p_details = subparsers.add_parser('details', help='Get paper details')
    p_details.add_argument('arxiv_id', help='arXiv ID')
    p_details.add_argument('--json', action='store_true', help='Output JSON')
    p_details.set_defaults(func=cmd_details)

    # download
    p_download = subparsers.add_parser('download', help='Download paper PDF')
    p_download.add_argument('arxiv_id', help='arXiv ID')
    p_download.add_argument('--output', '-o', help='Output directory')
    p_download.set_defaults(func=cmd_download)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
