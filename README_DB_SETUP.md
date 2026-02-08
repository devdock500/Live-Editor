# MySQL Database Integration Setup

This project now supports MySQL for persistent file storage.

## 1. Database Setup

1.  Make sure you have MySQL installed and running.
2.  Create the database and tables using the provided schema:
    *   Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or CLI).
    *   Run the SQL commands found in `backend/schema.sql`.

## 2. Configuration

1.  Open the `.env` file in the root directory.
2.  Update the database credentials if they differ from the defaults:
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=code_editor_db
    PORT=5003
    ```

## 3. Running the Project

1.  **Install Dependencies:**
    ```bash
    npm install
    cd frontend/real-time-editor
    npm install
    ```

2.  **Start Backend:**
    From the root directory:
    ```bash
    node backend/index.js
    ```
    (Or use `nodemon backend/index.js` for development)

3.  **Start Frontend:**
    From the `frontend/real-time-editor` directory:
    ```bash
    npm run dev
    ```

## Features Added

*   **File Persistence:** Files are saved to the MySQL database.
*   **File Management:** Create, delete, and switch between files within a room.
*   **Real-time Sync:** File creation, deletion, and content updates are synced in real-time across all users in the room.
*   **Room Persistence:** Rooms are automatically created in the database when joined.
