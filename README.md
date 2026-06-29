# UniQuiz

**Live Demo:** [uniquiz.pages.dev](https://uniquiz.pages.dev/)

## The Problem
Educators and students waste hours manually extracting testing materials from lectures. Parsing unstructured or poorly formatted DOCX and PDF files typically breaks standard regular expressions. Furthermore, traditional testing platforms encourage mechanical memorization rather than targeted, analytical learning.

## The Solution
UniQuiz is an AI-powered platform that automates the generation of educational tests. It converts raw materials into interactive training modules instantly.

*   **AI Generation:** Integrates the Google Gemini API to read raw lecture notes and automatically generate complex testing modules based on custom user prompts.
*   **Smart Parsing (Human Engineering):** Bypasses the limitations of standard parsers on unformatted text. The platform asks the user to input the exact number of answer options present in their file. The backend algorithm uses this integer as a mathematical validator to perfectly slice monolithic, broken text into structured JSON.
*   **Adaptive Learning:** Implements an error-correction algorithm that tracks user performance and dynamically generates test sessions consisting solely of previously failed questions.

## Architecture & Tech Stack
The project utilizes a decoupled microservice architecture to isolate heavy processing from UI rendering.

*   **Frontend:** React (Vite, Tailwind CSS). Hosted on Cloudflare Pages. Performs direct CRUD operations against the database to minimize latency.
*   **Backend:** FastAPI (Python). An isolated microservice hosted on Render. Responsible for heavy I/O operations, binary file parsing, and LLM orchestration.
*   **Database & Security:** PostgreSQL via Supabase. Enforces strict Row Level Security (RLS) policies at the database level to ensure complete isolation of user data and logs. Supports Google OAuth for secure SSO.

## Repositories
*   **Frontend Client:** [quiz-app](https://github.com/Sansanych122/quiz-app)
*   **Backend API:** [uniq-parser-api](https://github.com/Sansanych122/uniq-parser-api)

## Author
Developed by Smyk Oleksandr.
