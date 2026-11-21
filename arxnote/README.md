# Arxnote

The research desk for this project. Ask a question and the agent searches ArXiv, opens abstracts, and writes a sourced report.

```bash
npm install
npm run dev
```

The dev server listens on port 3847. `OPENAI_API_KEY` switches the writer to gpt-4o. `SERPAPI_API_KEY` adds a Google search. Without those keys the desk still runs on live ArXiv abstracts.

The notebook that builds the LangGraph agent is in `../notebooks/research_agent.ipynb`.
