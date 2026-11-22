# Arxnote desk

The web app for this repository. Ask a question and the agent searches ArXiv, shows each lookup, and writes a sourced report.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

`OPENAI_API_KEY` switches the writer to GPT-4o. `SERPAPI_API_KEY` adds Google search. Without those keys the desk still runs on live ArXiv abstracts.

The LangGraph notebook is `../notebooks/research_agent.ipynb`. Setup for the whole project is in the repository README.
