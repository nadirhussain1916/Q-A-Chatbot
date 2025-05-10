# Artilense Chatbot Application

This project is a chatbot application built with a **FastAPI** backend and a **React** frontend. It integrates OpenAI's GPT model for AI responses.

## Logic Behind the Project

The chatbot maintains conversation threads for each user. Each thread stores a history of messages, allowing users to continue conversations seamlessly. Threads are managed in memory and cleaned up periodically to remove inactive ones.

## How Threads Are Handled

- Each user is assigned a unique thread.
- Threads store message history and are linked to users.
- Inactive threads are automatically cleaned up after a set duration.

## How to Run the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
4. The backend will be available at `http://localhost:8000`.

## How to Run the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the required Node.js packages:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. The frontend will be available at `http://localhost:3000`.

## How to Test the API

1. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
2. Use an API testing tool like Postman or cURL to test the `/chatbot` endpoint:
   ```bash
   curl -X POST http://localhost:8000/chatbot \
        -H "Content-Type: application/json" \
        -d '{"user_id": "user123", "message": "Hello!"}'
   ```
3. The response will include the AI's reply, message history, and thread ID.
