# Arxnote

Arxnote is a research agent for questions about papers and methods. It opens ArXiv first, records every lookup, and writes a short report that stays inside those sources.

Live desk: [arxnote-tech-da19.vercel.app](https://arxnote-tech-da19.vercel.app)

Ask “What is the ArXiv paper 1706.03762 about?” The scratchpad should show the paper fetch, and the report should name *Attention Is All You Need*.

## What you get

The desk is a Next.js app in `arxnote/`. A question runs through four tools, and each result appears before the report:

| Tool | What it does |
| --- | --- |
| `fetch_arxiv` | Opens one paper by ArXiv id and reads the abstract |
| `arxiv_search` | Searches ArXiv for related papers |
| `web_search` | Adds Google results when `SERPAPI_API_KEY` is set |
| `final_answer` | Writes the introduction, steps, body, conclusion, and source list |

With `OPENAI_API_KEY`, GPT-4o chooses the tools and writes the report. Without it, the same page still answers from the live ArXiv abstracts. Tool text is treated as evidence, not as instructions.

The notebook in `notebooks/research_agent.ipynb` is the full pipeline behind that desk: ArXiv export, PDF download, chunking, Pinecone retrieval, and a LangGraph loop.

## Repository layout

```
arxnote/                         Next.js desk
notebooks/research_agent.ipynb   LangGraph research pipeline
requirements.txt                 Python dependencies
.env.example                     Key names for the notebook
```

## Run the desk

```bash
cd arxnote
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

On Windows PowerShell, from the repository root:

```powershell
cd arxnote
npm install
npm run dev
```

## Run the notebook

```bash
python -m venv .venv
```

Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS and Linux:

```bash
source .venv/bin/activate
```

Then:

```bash
pip install -r requirements.txt
copy .env.example .env
jupyter lab notebooks/research_agent.ipynb
```

Use `cp .env.example .env` instead of `copy` on macOS and Linux. Put keys only in `.env`. Leave `.env.example` empty.

The early notebook cells use a small `max_results` so they finish quickly. Raise it when you want a larger corpus.

## Environment

| Name | Used by |
| --- | --- |
| `OPENAI_API_KEY` | GPT-4o in the desk, and embeddings in the notebook |
| `SERPAPI_API_KEY` | Google search in the desk and the notebook |
| `PINECONE_API_KEY` | The notebook vector index `langgraph-research-agent` |

ArXiv fetch, PDF download, chunking, and the desk’s ArXiv brief run with no keys. Cells that need a missing key skip with a short message.

## Notebook pipeline

1. Query the ArXiv API and save papers as JSON and a pandas table.
2. Download each PDF.
3. Split the PDFs into overlapping chunks, with links to the previous and next chunk.
4. Embed chunks with `text-embedding-3-small` and store them in a Pinecone serverless index.
5. Define the tools: ArXiv abstract fetch, Google search, open and filtered retrieval, and `final_answer`.
6. Run the LangGraph loop: decide, route, call a tool, and build the report.

## Stack

Next.js, React, TypeScript, and Tailwind for the desk. Python, LangChain, LangGraph, Pinecone, and Jupyter for the notebook. ArXiv is the paper source. SerpAPI is the optional web source. GPT-4o is the optional writer.
