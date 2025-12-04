import postgres from "postgres";

import environment from "~/server/environment";

const SQL = postgres(environment.COCKROACHDB_CONNECTION_URL);

await SQL`
    CREATE SCHEMA IF NOT EXISTS todo_app;

    CREATE TYPE todo_app.priority AS ENUM ('low', 'medium', 'high');

    CREATE TABLE IF NOT EXISTS todo_app.users(
        id SERIAL UNIQUE,
        email VARCHAR(128) NOT NULL UNIQUE,
        password_hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()::timestamp,
        is_new_user BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS todo_app.entries(
        id SERIAL,
        user_id INTEGER,
        title VARCHAR(64) NOT NULL,
        description VARCHAR(2048) NOT NULL,
        completed BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()::timestamp,
        due_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
        priority todo_app.priority NOT NULL,

        FOREIGN KEY (user_id) REFERENCES todo_app.users(id) ON DELETE CASCADE
    );
`.simple();
await SQL.end({ timeout: 5 });
