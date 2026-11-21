# Research Agent

A research agent that pulls papers from ArXiv, chunks them for retrieval, and answers questions with LangGraph, GPT-4o, Pinecone, and Google SerpAPI.

This repository is the research agent from the project notebook, plus Arxnote, the React desk that runs the same tools.

The notebook is `notebooks/research_agent.ipynb`. The desk is the Next.js app in `arxnote/`.

## What part 1 does

1. Query the ArXiv API and save the result as JSON and a pandas DataFrame.
2. Download each paper PDF.
3. Split the PDFs into overlapping chunks and expand the table so each chunk is its own row, with links to the previous and next chunk.
4. Prepare an OpenAI embedding encoder (`text-embedding-3-small`) and a Pinecone serverless index named `langgraph-research-agent`.
5. Upsert chunk embeddings into that index.
6. Add the agent tools: ArXiv abstract fetch, Google search through SerpAPI, filtered and open RAG search, and a `final_answer` report writer.
7. Initialize the decision prompt (`gpt-4o`) and the scratchpad that records tool calls.
8. Build the LangGraph loop: `run_oracle`, `router`, `run_tool`, and `build_report`.

Sections 1–3, the ArXiv fetch tool, the router, and `build_report` run with no API keys. Embeddings, Pinecone, and the live model need `OPENAI_API_KEY`. Pinecone also needs `PINECONE_API_KEY`. Web search needs `SERPAPI_API_KEY`. Cells that need a missing key skip with a short message.

## The desk

`arxnote/` is the Next.js app. Ask a question and it searches ArXiv, opens abstracts, and writes a sourced brief. With `OPENAI_API_KEY` the same request is written by gpt-4o. With `SERPAPI_API_KEY` it also runs a Google search.

```bash
cd arxnote
npm install
npm run dev
```

The dev server listens on port 3847.

## Run it

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
jupyter lab notebooks/research_agent.ipynb
```

The first code cells use a small `max_results` so the notebook finishes quickly. Raise it to `100` for the full corpus used in the original project.
