import mysql from 'mysql2/promise'

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rei_db',
})

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await db.query(sql, params)
  return rows as T[]
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const [rows] = await db.query(sql, params)
  const arr = rows as T[]
  return arr[0] || null
}
