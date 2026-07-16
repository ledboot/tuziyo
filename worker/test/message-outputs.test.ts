import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EVOLINK_TASK_OBJECTS, MIME_TYPES, getEvoLinkTaskMimeType } from "../src/const"

const databases: Database[] = []

function createDatabase() {
  const database = new Database(":memory:")
  databases.push(database)
  database.run("PRAGMA foreign_keys = ON")
  database.exec(readFileSync(join(import.meta.dir, "../../db/schema.sql"), "utf8"))
  return database
}

function insertMessageFixture(database: Database) {
  database
    .query("INSERT INTO users (id, email, name) VALUES ('user-1', 'user@example.com', 'User')")
    .run()
  database
    .query("INSERT INTO sessions (id, user_id, title) VALUES ('session-1', 'user-1', 'Session')")
    .run()
  database
    .query(
      `
        INSERT INTO messages (id, session_id, user_id, role, provider, model, prompt, num_images)
        VALUES ('message-1', 'session-1', 'user-1', 'user', 'provider', 'model', 'Prompt', 3)
      `
    )
    .run()
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close()
  }
})

describe("message outputs schema", () => {
  test("stores image keys only in message_outputs", () => {
    const database = createDatabase()
    const messageColumns = database.query("PRAGMA table_info(messages)").all() as Array<{
      name: string
    }>

    expect(messageColumns.map(column => column.name)).not.toContain("image_url")
  })

  test("moves ratio-like image sizes into aspect_ratio", () => {
    const database = createDatabase()
    insertMessageFixture(database)
    database
      .query("UPDATE messages SET image_size = '16:9' WHERE id = 'message-1'")
      .run()

    database.exec(
      readFileSync(
        join(import.meta.dir, "../../db/migrations/0007_move_ratio_sizes_to_aspect_ratio.sql"),
        "utf8"
      )
    )

    expect(
      database
        .query("SELECT aspect_ratio, image_size FROM messages WHERE id = 'message-1'")
        .get()
    ).toEqual({ aspect_ratio: "16:9", image_size: null })
  })

  test("stores multiple ordered outputs under one message", () => {
    const database = createDatabase()
    insertMessageFixture(database)

    const insert = database.query(
      `
        INSERT INTO message_outputs (id, message_id, output_index, status, image_url, content_type)
        VALUES (?, 'message-1', ?, 'completed', ?, 'image')
      `
    )

    insert.run("output-1", 0, "generated/user-1/output-1.png")
    insert.run("output-2", 1, "generated/user-1/output-2.png")
    insert.run("output-3", 2, "generated/user-1/output-3.png")

    const outputs = database
      .query(
        "SELECT id, output_index FROM message_outputs WHERE message_id = ? ORDER BY output_index"
      )
      .all("message-1") as Array<{ id: string; output_index: number }>

    expect(outputs).toEqual([
      { id: "output-1", output_index: 0 },
      { id: "output-2", output_index: 1 },
      { id: "output-3", output_index: 2 },
    ])
  })

  test("allows separate favorites for outputs from the same message", () => {
    const database = createDatabase()
    insertMessageFixture(database)
    database
      .query(
        `
          INSERT INTO message_outputs (id, message_id, output_index, status, image_url, content_type)
          VALUES ('output-1', 'message-1', 0, 'completed', 'one.png', 'image'),
                 ('output-2', 'message-1', 1, 'completed', 'two.png', 'image')
        `
      )
      .run()

    const insertFavorite = database.query(
      `
        INSERT INTO content_favorites (id, user_id, content_type, message_id, output_id)
        VALUES (?, 'user-1', 'image', 'message-1', ?)
      `
    )

    insertFavorite.run("favorite-1", "output-1")
    insertFavorite.run("favorite-2", "output-2")

    const count = database
      .query("SELECT COUNT(*) AS count FROM content_favorites WHERE message_id = 'message-1'")
      .get() as { count: number }
    expect(count.count).toBe(2)
    expect(() => insertFavorite.run("favorite-3", "output-1")).toThrow()
  })

  test("generation task records the parent message and output progress", () => {
    const database = createDatabase()
    insertMessageFixture(database)

    database
      .query(
        `
          INSERT INTO generation_tasks (
            id, user_id, session_id, message_id, model, status,
            requested_count, completed_count, failed_count
          )
          VALUES ('task-1', 'user-1', 'session-1', 'message-1', 'model', 'completed', 3, 2, 1)
        `
      )
      .run()

    const task = database
      .query(
        "SELECT message_id, requested_count, completed_count, failed_count FROM generation_tasks WHERE id = 'task-1'"
      )
      .get()

    expect(task).toEqual({
      message_id: "message-1",
      requested_count: 3,
      completed_count: 2,
      failed_count: 1,
    })
  })

  test("incremental migration preserves legacy favorites", () => {
    const database = new Database(":memory:")
    databases.push(database)
    database.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY);
      CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        output_format TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE generation_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        model TEXT,
        provider TEXT,
        provider_task_id TEXT,
        status TEXT NOT NULL,
        input TEXT,
        result TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE content_favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        message_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(user_id, content_type, message_id)
      );
      CREATE INDEX idx_content_favorites_user_id ON content_favorites(user_id);
      CREATE INDEX idx_content_favorites_content_type ON content_favorites(content_type);
      CREATE INDEX idx_content_favorites_message_id ON content_favorites(message_id);
      CREATE INDEX idx_content_favorites_created_at ON content_favorites(created_at);

      INSERT INTO users (id) VALUES ('user-1');
      INSERT INTO sessions (id, user_id) VALUES ('session-1', 'user-1');
      INSERT INTO messages (id, session_id, user_id, image_url, created_at)
      VALUES ('message-1', 'session-1', 'user-1', 'generated/user-1/legacy.png', 1);
      INSERT INTO generation_tasks (
        id, user_id, session_id, status, input, result, created_at, updated_at
      )
      VALUES (
        'task-1', 'user-1', 'session-1', 'completed', '{"num_images":1}',
        '{"messageId":"message-1"}', 1, 1
      );
      INSERT INTO content_favorites (id, user_id, content_type, message_id, created_at)
      VALUES ('favorite-1', 'user-1', 'image', 'message-1', 1);
    `)

    database.exec(
      readFileSync(join(import.meta.dir, "../../db/migrations/0002_message_outputs.sql"), "utf8")
    )
    database.exec(
      readFileSync(
        join(import.meta.dir, "../../db/migrations/0003_backfill_legacy_message_outputs.sql"),
        "utf8"
      )
    )
    database.exec(
      readFileSync(
        join(import.meta.dir, "../../db/migrations/0004_message_output_mime_type_enum.sql"),
        "utf8"
      )
    )
    database.exec(
      readFileSync(
        join(import.meta.dir, "../../db/migrations/0005_rename_mime_type_to_content_type.sql"),
        "utf8"
      )
    )
    database.exec(
      readFileSync(
        join(import.meta.dir, "../../db/migrations/0006_remove_messages_image_url.sql"),
        "utf8"
      )
    )

    const taskColumns = database.query("PRAGMA table_info(generation_tasks)").all() as Array<{
      name: string
    }>
    const messageColumns = database.query("PRAGMA table_info(messages)").all() as Array<{
      name: string
    }>
    const favorite = database
      .query("SELECT message_id, output_id FROM content_favorites WHERE id = 'favorite-1'")
      .get()
    const output = database
      .query(
        "SELECT message_id, output_index, status, image_url, content_type FROM message_outputs WHERE id = 'legacy-message-1'"
      )
      .get()
    const task = database
      .query(
        "SELECT message_id, requested_count, completed_count, failed_count FROM generation_tasks WHERE id = 'task-1'"
      )
      .get()
    const message = database
      .query("SELECT output_format FROM messages WHERE id = 'message-1'")
      .get()

    expect(taskColumns.map(column => column.name)).toContain("message_id")
    expect(taskColumns.map(column => column.name)).toContain("requested_count")
    expect(messageColumns.map(column => column.name)).not.toContain("image_url")
    expect(message).toEqual({ output_format: "png" })
    expect(favorite).toEqual({ message_id: "message-1", output_id: "legacy-message-1" })
    expect(output).toEqual({
      message_id: "message-1",
      output_index: 0,
      status: "completed",
      image_url: "generated/user-1/legacy.png",
      content_type: "image",
    })
    expect(task).toEqual({
      message_id: "message-1",
      requested_count: 1,
      completed_count: 1,
      failed_count: 0,
    })
    expect(() =>
      database
        .query(
          `
            INSERT INTO message_outputs (id, message_id, output_index, status, content_type)
            VALUES ('invalid-output', 'message-1', 1, 'completed', 'document')
          `
        )
        .run()
    ).toThrow()
  })
})

describe("media type constants", () => {
  test("maps every EvoLink generation object to its media type", () => {
    expect(getEvoLinkTaskMimeType(EVOLINK_TASK_OBJECTS.IMAGE)).toBe(MIME_TYPES.IMAGE)
    expect(getEvoLinkTaskMimeType(EVOLINK_TASK_OBJECTS.VIDEO)).toBe(MIME_TYPES.VIDEO)
    expect(getEvoLinkTaskMimeType(EVOLINK_TASK_OBJECTS.AUDIO)).toBe(MIME_TYPES.AUDIO)
  })

  test("rejects unsupported EvoLink object types", () => {
    expect(getEvoLinkTaskMimeType("document.generation.task")).toBeNull()
    expect(getEvoLinkTaskMimeType(null)).toBeNull()
  })
})
