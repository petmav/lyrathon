import { db } from '@/lib/db';

export async function saveRecruiter(
  input: {
    name: string;
    email: string;
    password_hash: string;
    organisation: string;
    role_title?: string;
    notes?: string;
  },
): Promise<any> {
  const existing = await db.query(
    `SELECT recruiter_id FROM recruiter WHERE email = $1`,
    [input.email],
  );

  if (!existing.rowCount) {
    const result = await db.query(
      `
        INSERT INTO recruiter (
          name,
          email,
          password_hash,
          organisation,
          role_title,
          notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        RETURNING *
      `,
      [
        input.name,
        input.email,
        input.password_hash,
        input.organisation ?? null,
        input.role_title ?? null,
        input.notes ?? null,
      ],
    );

    return result.rows[0];
  }

  const updates: string[] = [];
  const values: Array<string | null> = [];
  const hasField = (field: keyof typeof input) => Object.prototype.hasOwnProperty.call(input, field);

  const pushUpdate = (field: string, value: string | null) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (hasField('name')) pushUpdate('name', input.name);
  if (hasField('password_hash')) pushUpdate('password_hash', input.password_hash);
  if (hasField('organisation')) pushUpdate('organisation', input.organisation);
  if (hasField('role_title')) pushUpdate('role_title', input.role_title ?? null);
  if (hasField('notes')) pushUpdate('notes', input.notes ?? null);

  updates.push('updated_at = NOW()');
  values.push(input.email);

  const result = await db.query(
    `
      UPDATE recruiter
      SET ${updates.join(', ')}
      WHERE email = $${values.length}
      RETURNING *
    `,
    values,
  );

  return result.rows[0];
}

export async function saveRecruiterQuery(
  input: {
    conversation_id: string;
    query_text: string;
    is_assistant: boolean;
  },
): Promise<any> {
    const result = await db.query(
        `
        INSERT INTO recruiter_queries (
            conversation_id,
            query_text,
            is_assistant
        ) VALUES (
            $1, $2, $3
        ) RETURNING *
        `,
        [
            input.conversation_id,
            input.query_text,
            input.is_assistant,
        ],
    );

    return result.rows[0];
}

export async function newConversation(recruiterId: string, title: string) {
  const result = await db.query(
    `INSERT INTO conversation (recruiter_id, title) VALUES ($1, $2) RETURNING *`,
    [recruiterId, title]
  );
  return result.rows[0];
}

export async function getConversationQueries(conversationId: string) {
  const result = await db.query(
    `SELECT * FROM recruiter_queries WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

export async function getRecruiterConversations(recruiterId: string) {
  const result = await db.query(
    `SELECT * FROM conversation WHERE recruiter_id = $1 ORDER BY created_at DESC`,
    [recruiterId]
  );
  return result.rows;
}